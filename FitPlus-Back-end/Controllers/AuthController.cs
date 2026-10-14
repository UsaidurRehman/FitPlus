using FitPulseBackend.Security;
using System;
using System.ComponentModel.DataAnnotations;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Web.Http;

namespace FitPulseBackend.Controllers
{
    public class AuthController : ApiController
    {
        private readonly FitPulseEntities _dbContext;

        public AuthController()
        {
            _dbContext = FitPulseEntitiesFactory.Create();
        }

        public class LoginDTO
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        public class RegisterDTO
        {
            public string Email { get; set; }
            public string Password { get; set; }
            public string FullName { get; set; }
        }

        public class UserDTO
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public string Email { get; set; }
        }

        public class AuthResponseDTO
        {
            public string Token { get; set; }
            public UserDTO User { get; set; }
        }

        /// <summary>
        /// POST /api/Auth/Login
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        public IHttpActionResult Login([FromBody] LoginDTO loginDto)
        {
            if (loginDto == null || !ModelState.IsValid)
            {
                return Error(HttpStatusCode.BadRequest, "A valid email and password are required.");
            }

            var email = NormalizeEmail(loginDto.Email);
            if (!IsValidEmail(email) || string.IsNullOrWhiteSpace(loginDto.Password) || loginDto.Password.Length > 256)
            {
                return Error(HttpStatusCode.BadRequest, "A valid email and password are required.");
            }

            var user = _dbContext.Users.FirstOrDefault(u => u.Email.ToLower() == email);
            if (user == null)
            {
                return Unauthorized();
            }

            bool needsRehash;
            if (!PasswordHasher.Verify(loginDto.Password, user.PasswordHash, out needsRehash))
            {
                return Unauthorized();
            }

            JwtTokenService.EnsureConfigured();
            if (needsRehash)
            {
                user.PasswordHash = PasswordHasher.Hash(loginDto.Password);
                _dbContext.SaveChanges();
            }

            return Ok(CreateAuthResponse(user));
        }

        /// <summary>
        /// POST /api/Auth/Register
        /// </summary>
        [HttpPost]
        [AllowAnonymous]
        public IHttpActionResult Register([FromBody] RegisterDTO registerDto)
        {
            if (registerDto == null || !ModelState.IsValid)
            {
                return Error(HttpStatusCode.BadRequest, "A valid name, email, and password are required.");
            }

            var fullName = (registerDto.FullName ?? string.Empty).Trim();
            var email = NormalizeEmail(registerDto.Email);
            var password = registerDto.Password;

            if (fullName.Length == 0 || fullName.Length > 100)
            {
                return Error(HttpStatusCode.BadRequest, "Full name must be between 1 and 100 characters.");
            }

            if (!IsValidEmail(email))
            {
                return Error(HttpStatusCode.BadRequest, "Enter a valid email address (maximum 256 characters).");
            }

            if (string.IsNullOrEmpty(password) || password.Length < 6 || password.Length > 256)
            {
                return Error(HttpStatusCode.BadRequest, "Password must be between 6 and 256 characters.");
            }

            // Validate the signing configuration before writing the account.
            JwtTokenService.EnsureConfigured();

            if (_dbContext.Users.Any(u => u.Email.ToLower() == email))
            {
                return Error(HttpStatusCode.Conflict, "Email already exists.");
            }

            var newUser = new Users
            {
                Email = email,
                PasswordHash = PasswordHasher.Hash(password),
                FullName = fullName,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Users.Add(newUser);
            _dbContext.SaveChanges();

            return Content(HttpStatusCode.Created, CreateAuthResponse(newUser));
        }

        /// <summary>
        /// GET /api/Auth/Me
        /// Returns the signed-in user's public profile for session restoration.
        /// </summary>
        [HttpGet]
        [Authorize]
        [Route("api/Auth/Me")]
        public IHttpActionResult Me()
        {
            int userId;
            if (!TryGetUserId(out userId))
            {
                return Unauthorized();
            }

            var user = _dbContext.Users
                .AsNoTracking()
                .FirstOrDefault(u => u.UserId == userId);

            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(ToUserDTO(user));
        }

        private AuthResponseDTO CreateAuthResponse(Users user)
        {
            return new AuthResponseDTO
            {
                Token = JwtTokenService.CreateToken(user),
                User = ToUserDTO(user)
            };
        }

        private static UserDTO ToUserDTO(Users user)
        {
            return new UserDTO
            {
                Id = user.UserId,
                Name = user.FullName,
                Email = user.Email
            };
        }

        private static string NormalizeEmail(string email)
        {
            return (email ?? string.Empty).Trim().ToLowerInvariant();
        }

        private static bool IsValidEmail(string email)
        {
            return !string.IsNullOrWhiteSpace(email) &&
                   email.Length <= 256 &&
                   new EmailAddressAttribute().IsValid(email);
        }

        private IHttpActionResult Error(HttpStatusCode statusCode, string message)
        {
            return Content(statusCode, new { message });
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var identity = User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? identity?.FindFirst("sub")?.Value;
            return int.TryParse(userIdClaim, out userId) && userId > 0;
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _dbContext.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
