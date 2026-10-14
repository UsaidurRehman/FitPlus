using System;
using System.Configuration;
using System.Data.Entity;
using System.Linq;
using System.Security.Claims;
using System.Web.Http;

namespace FitPulseBackend.Controllers
{
    public class DashboardController : ApiController
    {
        private readonly FitPulseEntities _dbContext;

        public DashboardController()
        {
            _dbContext = FitPulseEntitiesFactory.Create();
        }

        public class DailySummaryDTO
        {
            public DateTime Date { get; set; }
            public decimal TotalCalories { get; set; }
            public decimal TotalProteinGrams { get; set; }
            public decimal TotalCarbsGrams { get; set; }
            public decimal TotalFatGrams { get; set; }
            public int TotalWorkouts { get; set; }
            public int TotalWorkoutDurationMinutes { get; set; }
            public int TotalMealLogs { get; set; }
        }

        /// <summary>
        /// GET /api/Dashboard/DailySummary?date=YYYY-MM-DD
        /// The requested date is interpreted in the configured FitPulse time zone.
        /// </summary>
        [HttpGet]
        [Authorize]
        [Route("api/Dashboard/DailySummary")]
        public IHttpActionResult GetDailySummary(DateTime? date = null)
        {
            int userId;
            if (!TryGetUserId(out userId))
            {
                return Unauthorized();
            }

            var timeZone = GetSummaryTimeZone();
            var currentLocalDate = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone).Date;
            var requestedDate = (date ?? currentLocalDate).Date;
            if (requestedDate >= DateTime.MaxValue.Date)
            {
                return BadRequest("Date must be before 9999-12-31.");
            }

            // The UI sends its local YYYY-MM-DD date while log timestamps are
            // stored as UTC. Query the corresponding UTC half-open interval.
            var targetDate = DateTime.SpecifyKind(requestedDate, DateTimeKind.Unspecified);
            var startDate = TimeZoneInfo.ConvertTimeToUtc(targetDate, timeZone);
            var endDate = TimeZoneInfo.ConvertTimeToUtc(targetDate.AddDays(1), timeZone);

            // Project only the columns needed for the summary. This avoids loading
            // EF navigation graphs and the previous per-log/per-item lazy-load queries.
            var mealItems = _dbContext.MealItems
                .AsNoTracking()
                .Where(item => item.MealLogs.Users.UserId == userId &&
                               item.MealLogs.LoggedAt >= startDate &&
                               item.MealLogs.LoggedAt < endDate)
                .Select(item => new
                {
                    item.Servings,
                    item.FoodItems.Calories,
                    item.FoodItems.ProteinGrams,
                    item.FoodItems.CarbsGrams,
                    item.FoodItems.FatGrams
                })
                .ToList();

            var totalCalories = mealItems.Sum(item => item.Calories * item.Servings);
            var totalProtein = mealItems.Sum(item => item.ProteinGrams * item.Servings);
            var totalCarbs = mealItems.Sum(item => item.CarbsGrams * item.Servings);
            var totalFat = mealItems.Sum(item => item.FatGrams * item.Servings);

            var totalMealLogs = _dbContext.MealLogs
                .AsNoTracking()
                .Count(log => log.Users.UserId == userId &&
                              log.LoggedAt >= startDate &&
                              log.LoggedAt < endDate);

            var workoutDurations = _dbContext.WorkoutLogs
                .AsNoTracking()
                .Where(log => log.Users.UserId == userId &&
                              log.LoggedAt >= startDate &&
                              log.LoggedAt < endDate)
                .Select(log => log.DurationMinutes)
                .ToList();

            return Ok(new DailySummaryDTO
            {
                Date = targetDate,
                TotalCalories = Math.Round(totalCalories, 2),
                TotalProteinGrams = Math.Round(totalProtein, 2),
                TotalCarbsGrams = Math.Round(totalCarbs, 2),
                TotalFatGrams = Math.Round(totalFat, 2),
                TotalWorkouts = workoutDurations.Count,
                TotalWorkoutDurationMinutes = workoutDurations.Sum(),
                TotalMealLogs = totalMealLogs
            });
        }

        private static TimeZoneInfo GetSummaryTimeZone()
        {
            var timeZoneId = Environment.GetEnvironmentVariable("FITPULSE_TIME_ZONE_ID");
            if (string.IsNullOrWhiteSpace(timeZoneId))
            {
                timeZoneId = ConfigurationManager.AppSettings["FitPulse:TimeZoneId"];
            }

            if (string.IsNullOrWhiteSpace(timeZoneId))
            {
                return TimeZoneInfo.Local;
            }

            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException exception)
            {
                throw new ConfigurationErrorsException("FITPULSE_TIME_ZONE_ID is not a valid time zone ID.", exception);
            }
            catch (InvalidTimeZoneException exception)
            {
                throw new ConfigurationErrorsException("FITPULSE_TIME_ZONE_ID refers to an invalid time zone.", exception);
            }
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
