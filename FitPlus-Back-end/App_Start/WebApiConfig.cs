using FitPulseBackend.Security;
using Newtonsoft.Json.Serialization;
using System.Web.Http;

namespace FitPulseBackend
{
    public static class WebApiConfig
    {
        public static void Register(HttpConfiguration config)
        {
            // Validate bearer JWTs before [Authorize] checks the request principal.
            config.Filters.Add(new JwtAuthenticationFilter());

            // The React Native client expects JavaScript-style property names
            // (user.id, foodItem.foodItemId, summary.totalCalories, etc.).
            config.Formatters.JsonFormatter.SerializerSettings.ContractResolver =
                new CamelCasePropertyNamesContractResolver();

            config.MapHttpAttributeRoutes();
            config.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = RouteParameter.Optional }
            );
        }
    }
}
