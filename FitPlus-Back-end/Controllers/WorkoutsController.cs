using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Web.Http;

namespace FitPulseBackend.Controllers
{
    public class WorkoutsController : ApiController
    {
        private readonly FitPulseEntities _dbContext;

        public WorkoutsController()
        {
            _dbContext = FitPulseEntitiesFactory.Create();
        }

        public class ExerciseDTO
        {
            public int ExerciseId { get; set; }
            public string Name { get; set; }
            public string MuscleGroup { get; set; }
            public string Equipment { get; set; }
        }

        public class WorkoutSetDTO
        {
            public int ExerciseId { get; set; }
            public int SetNumber { get; set; }
            public int Reps { get; set; }
            public decimal Weight { get; set; }
        }

        public class CreateWorkoutLogDTO
        {
            public string Title { get; set; }
            public int DurationMinutes { get; set; }
            public DateTimeOffset? LoggedAt { get; set; }
            public List<WorkoutSetDTO> Sets { get; set; } = new List<WorkoutSetDTO>();
        }

        /// <summary>
        /// GET /api/Workouts/Exercises
        /// Returns the flat exercise shape consumed by the app.
        /// </summary>
        [HttpGet]
        [Route("api/Workouts/Exercises")]
        public IHttpActionResult GetExercises()
        {
            var exercises = _dbContext.Exercises
                .AsNoTracking()
                .OrderBy(exercise => exercise.Name)
                .Select(exercise => new ExerciseDTO
                {
                    ExerciseId = exercise.ExerciseId,
                    Name = exercise.Name,
                    MuscleGroup = exercise.MuscleGroup,
                    Equipment = exercise.Equipment
                })
                .ToList();

            return Ok(exercises);
        }

        /// <summary>
        /// POST /api/Workouts/Log
        /// </summary>
        [HttpPost]
        [Authorize]
        [Route("api/Workouts/Log")]
        public IHttpActionResult LogWorkout([FromBody] CreateWorkoutLogDTO dto)
        {
            if (dto == null || !ModelState.IsValid)
            {
                return Error(HttpStatusCode.BadRequest, "Invalid workout payload.");
            }

            var title = (dto.Title ?? string.Empty).Trim();
            if (title.Length == 0 || title.Length > 100)
            {
                return Error(HttpStatusCode.BadRequest, "Workout title must be between 1 and 100 characters.");
            }

            if (dto.DurationMinutes < 1 || dto.DurationMinutes > 1440)
            {
                return Error(HttpStatusCode.BadRequest, "Duration must be between 1 and 1440 minutes.");
            }

            if (dto.Sets == null || dto.Sets.Count == 0 || dto.Sets.Count > 100)
            {
                return Error(HttpStatusCode.BadRequest, "A workout must contain between 1 and 100 sets.");
            }

            if (dto.Sets.Any(set => set == null || set.ExerciseId <= 0 ||
                                    set.SetNumber <= 0 || set.Reps <= 0 ||
                                    set.Weight < 0 || set.Weight > 999.99m ||
                                    decimal.Round(set.Weight, 2) != set.Weight))
            {
                return Error(HttpStatusCode.BadRequest, "Each set needs a valid exercise, positive set number/reps, and weight from 0 to 999.99 kg.");
            }

            int userId;
            if (!TryGetUserId(out userId))
            {
                return Unauthorized();
            }

            var user = _dbContext.Users.FirstOrDefault(candidate => candidate.UserId == userId);
            if (user == null)
            {
                return Unauthorized();
            }

            var exerciseIds = dto.Sets.Select(set => set.ExerciseId).Distinct().ToList();
            var exercises = _dbContext.Exercises
                .Where(exercise => exerciseIds.Contains(exercise.ExerciseId))
                .ToDictionary(exercise => exercise.ExerciseId);

            if (exerciseIds.Any(id => !exercises.ContainsKey(id)))
            {
                return Error(HttpStatusCode.BadRequest, "One or more selected exercises do not exist.");
            }

            var workoutLog = new WorkoutLogs
            {
                Users = user,
                Title = title,
                DurationMinutes = dto.DurationMinutes,
                LoggedAt = dto.LoggedAt.HasValue ? dto.LoggedAt.Value.UtcDateTime : DateTime.UtcNow
            };

            foreach (var setDto in dto.Sets)
            {
                workoutLog.WorkoutSets.Add(new WorkoutSets
                {
                    Exercises = exercises[setDto.ExerciseId],
                    SetNumber = setDto.SetNumber,
                    Reps = setDto.Reps,
                    WeightKg = setDto.Weight
                });
            }

            _dbContext.WorkoutLogs.Add(workoutLog);
            _dbContext.SaveChanges();

            return Content(HttpStatusCode.Created, new
            {
                workoutLog.WorkoutLogId,
                workoutLog.Title,
                workoutLog.DurationMinutes,
                workoutLog.LoggedAt,
                TotalSets = workoutLog.WorkoutSets.Count
            });
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var identity = User.Identity as ClaimsIdentity;
            var userIdClaim = identity?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? identity?.FindFirst("sub")?.Value;
            return int.TryParse(userIdClaim, out userId) && userId > 0;
        }

        private IHttpActionResult Error(HttpStatusCode statusCode, string message)
        {
            return Content(statusCode, new { message });
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
