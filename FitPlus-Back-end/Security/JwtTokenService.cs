using Microsoft.IdentityModel.Tokens;
using System;
using System.Configuration;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FitPulseBackend.Security
{
    /// <summary>
    /// Creates and validates the bearer tokens used by the mobile/web client.
    /// Keep the signing key outside source control (FITPULSE_JWT_KEY).
    /// </summary>
    public static class JwtTokenService
    {
        private static readonly TimeSpan TokenLifetime = TimeSpan.FromDays(7);
        private static readonly TimeSpan ClockSkew = TimeSpan.FromMinutes(1);

        public static string CreateToken(Users user)
        {
            if (user == null)
            {
                throw new ArgumentNullException(nameof(user));
            }

            var now = DateTime.UtcNow;
            var credentials = new SigningCredentials(
                new SymmetricSecurityKey(GetSigningKey()),
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: GetIssuer(),
                audience: GetAudience(),
                claims: new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString(CultureInfo.InvariantCulture)),
                    new Claim(ClaimTypes.Name, user.FullName ?? string.Empty),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                },
                notBefore: now,
                expires: now.Add(TokenLifetime),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        /// <summary>
        /// Checks token signature, algorithm, issuer, audience, expiry and subject.
        /// Invalid/missing configuration is treated as an invalid token by callers.
        /// </summary>
        public static bool TryValidateToken(string token, out ClaimsPrincipal principal)
        {
            principal = null;
            if (string.IsNullOrWhiteSpace(token) || token.Length > 8192)
            {
                return false;
            }

            try
            {
                var handler = new JwtSecurityTokenHandler();
                SecurityToken validatedToken;
                var validatedPrincipal = handler.ValidateToken(token, CreateValidationParameters(), out validatedToken);
                var jwtToken = validatedToken as JwtSecurityToken;
                if (jwtToken == null || !string.Equals(jwtToken.Header.Alg, SecurityAlgorithms.HmacSha256, StringComparison.Ordinal))
                {
                    return false;
                }

                var subject = validatedPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? validatedPrincipal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                int userId;
                if (!int.TryParse(subject, NumberStyles.None, CultureInfo.InvariantCulture, out userId) || userId <= 0)
                {
                    return false;
                }

                principal = validatedPrincipal;
                return true;
            }
            catch (SecurityTokenException)
            {
                return false;
            }
            catch (ArgumentException)
            {
                return false;
            }
            catch (FormatException)
            {
                return false;
            }
            catch (ConfigurationErrorsException)
            {
                return false;
            }
        }

        /// <summary>
        /// Call before writing a user row so a missing signing key cannot leave
        /// registration half-completed.
        /// </summary>
        public static void EnsureConfigured()
        {
            GetSigningKey();
            GetIssuer();
            GetAudience();
        }

        private static TokenValidationParameters CreateValidationParameters()
        {
            return new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(GetSigningKey()),
                ValidateIssuer = true,
                ValidIssuer = GetIssuer(),
                ValidateAudience = true,
                ValidAudience = GetAudience(),
                ValidateLifetime = true,
                RequireExpirationTime = true,
                RequireSignedTokens = true,
                ClockSkew = ClockSkew,
                ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },
                AuthenticationType = "Bearer",
                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
            };
        }

        private static byte[] GetSigningKey()
        {
            var key = ReadSetting("Jwt:Key", "FITPULSE_JWT_KEY", null);
            if (string.IsNullOrWhiteSpace(key))
            {
                throw new ConfigurationErrorsException(
                    "Configure FITPULSE_JWT_KEY (at least 32 UTF-8 bytes) before issuing or validating JWTs.");
            }

            var bytes = Encoding.UTF8.GetBytes(key);
            if (bytes.Length < 32)
            {
                throw new ConfigurationErrorsException(
                    "FITPULSE_JWT_KEY must contain at least 32 UTF-8 bytes.");
            }

            return bytes;
        }

        private static string GetIssuer()
        {
            return ReadSetting("Jwt:Issuer", "FITPULSE_JWT_ISSUER", "FitPulse");
        }

        private static string GetAudience()
        {
            return ReadSetting("Jwt:Audience", "FITPULSE_JWT_AUDIENCE", "FitPulse.Mobile");
        }

        private static string ReadSetting(string appSettingName, string environmentVariableName, string fallback)
        {
            var value = Environment.GetEnvironmentVariable(environmentVariableName);
            if (string.IsNullOrWhiteSpace(value))
            {
                value = ConfigurationManager.AppSettings[appSettingName];
            }

            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }
    }
}
