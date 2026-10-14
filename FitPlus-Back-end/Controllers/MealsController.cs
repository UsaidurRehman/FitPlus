using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Web.Http;

namespace FitPulseBackend.Controllers
{
    public class MealsController : ApiController
    {
        private readonly FitPulseEntities _dbContext;

        public MealsController()
        {
            _dbContext = FitPulseEntitiesFactory.Create();
        }

        public class FoodItemDTO
        {
            public int FoodItemId { get; set; }
            public string Name { get; set; }
            public string ServingSizeUnit { get; set; }
            public decimal Calories { get; set; }
            public decimal ProteinGrams { get; set; }
            public decimal CarbsGrams { get; set; }
            public decimal FatGrams { get; set; }
        }

        public class MealItemDTO
        {
            public int FoodItemId { get; set; }
            public decimal Servings { get; set; }
        }

        public class CreateMealLogDTO
        {
            public string MealType { get; set; }
            public DateTimeOffset? LoggedAt { get; set; }
            public List<MealItemDTO> Items { get; set; } = new List<MealItemDTO>();
        }

        /// <summary>
        /// GET /api/Meals/FoodItems
        /// Returns only the catalog fields used by the app, not EF navigation graphs.
        /// </summary>
        [HttpGet]
        [Route("api/Meals/FoodItems")]
        public IHttpActionResult GetFoodItems()
        {
            var foodItems = _dbContext.FoodItems
                .AsNoTracking()
                .OrderBy(food => food.Name)
                .Select(food => new FoodItemDTO
                {
                    FoodItemId = food.FoodItemId,
                    Name = food.Name,
                    ServingSizeUnit = food.ServingSizeUnit,
                    Calories = food.Calories,
                    ProteinGrams = food.ProteinGrams,
                    CarbsGrams = food.CarbsGrams,
                    FatGrams = food.FatGrams
                })
                .ToList();

            return Ok(foodItems);
        }

        /// <summary>
        /// POST /api/Meals/Log
        /// </summary>
        [HttpPost]
        [Authorize]
        [Route("api/Meals/Log")]
        public IHttpActionResult LogMeal([FromBody] CreateMealLogDTO dto)
        {
            if (dto == null || !ModelState.IsValid)
            {
                return Error(HttpStatusCode.BadRequest, "Invalid meal log payload.");
            }

            if (dto.Items == null || dto.Items.Count == 0 || dto.Items.Count > 100)
            {
                return Error(HttpStatusCode.BadRequest, "A meal must contain between 1 and 100 food items.");
            }

            var mealType = NormalizeMealType(dto.MealType);
            if (mealType == null)
            {
                return Error(HttpStatusCode.BadRequest, "Meal type must be Breakfast, Lunch, Dinner, or Snack.");
            }

            if (dto.Items.Any(item => item == null || item.FoodItemId <= 0 ||
                                      item.Servings <= 0 || item.Servings > 99.99m ||
                                      decimal.Round(item.Servings, 2) != item.Servings))
            {
                return Error(HttpStatusCode.BadRequest, "Food IDs must be valid and servings must be between 0.01 and 99.99.");
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

            var foodIds = dto.Items.Select(item => item.FoodItemId).Distinct().ToList();
            var foodItems = _dbContext.FoodItems
                .Where(food => foodIds.Contains(food.FoodItemId))
                .ToDictionary(food => food.FoodItemId);

            var missingFoodId = foodIds.FirstOrDefault(id => !foodItems.ContainsKey(id));
            if (missingFoodId != 0)
            {
                return Error(HttpStatusCode.BadRequest, "One or more selected food items do not exist.");
            }

            var mealLog = new MealLogs
            {
                Users = user,
                MealType = mealType,
                LoggedAt = dto.LoggedAt.HasValue ? dto.LoggedAt.Value.UtcDateTime : DateTime.UtcNow
            };

            decimal totalCalories = 0;
            decimal totalProtein = 0;
            decimal totalCarbs = 0;
            decimal totalFat = 0;

            foreach (var itemDto in dto.Items)
            {
                var foodItem = foodItems[itemDto.FoodItemId];
                mealLog.MealItems.Add(new MealItems
                {
                    FoodItems = foodItem,
                    Servings = itemDto.Servings
                });

                totalCalories += foodItem.Calories * itemDto.Servings;
                totalProtein += foodItem.ProteinGrams * itemDto.Servings;
                totalCarbs += foodItem.CarbsGrams * itemDto.Servings;
                totalFat += foodItem.FatGrams * itemDto.Servings;
            }

            _dbContext.MealLogs.Add(mealLog);
            _dbContext.SaveChanges();

            return Content(HttpStatusCode.Created, new
            {
                mealLog.MealLogId,
                mealLog.MealType,
                mealLog.LoggedAt,
                TotalCalories = Math.Round(totalCalories, 2),
                TotalProteinGrams = Math.Round(totalProtein, 2),
                TotalCarbsGrams = Math.Round(totalCarbs, 2),
                TotalFatGrams = Math.Round(totalFat, 2),
                TotalItems = mealLog.MealItems.Count
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

        private static string NormalizeMealType(string mealType)
        {
            if (string.IsNullOrWhiteSpace(mealType))
            {
                return null;
            }

            var normalized = mealType.Trim();
            var allowedTypes = new[] { "Breakfast", "Lunch", "Dinner", "Snack" };
            return allowedTypes.FirstOrDefault(type =>
                string.Equals(type, normalized, StringComparison.OrdinalIgnoreCase));
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
