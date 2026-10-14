using System;
using System.Configuration;
using System.Data.EntityClient;

namespace FitPulseBackend
{
    /// <summary>
    /// Allows the ASP.NET app to receive database credentials from the host
    /// environment instead of committing them in Web.config.
    /// </summary>
    public static class FitPulseEntitiesFactory
    {
        private const string Metadata = "res://*/Model1.csdl|res://*/Model1.ssdl|res://*/Model1.msl";

        public static FitPulseEntities Create()
        {
            var sqlConnectionString = Environment.GetEnvironmentVariable("FITPULSE_SQL_CONNECTION_STRING");
            if (!string.IsNullOrWhiteSpace(sqlConnectionString))
            {
                var entityConnection = new EntityConnectionStringBuilder
                {
                    Metadata = Metadata,
                    Provider = "System.Data.SqlClient",
                    ProviderConnectionString = sqlConnectionString
                };

                return new FitPulseEntities(entityConnection.ToString());
            }

            var configuredConnection = ConfigurationManager.ConnectionStrings["FitPulseEntities"];
            if (configuredConnection != null && !string.IsNullOrWhiteSpace(configuredConnection.ConnectionString))
            {
                return new FitPulseEntities(configuredConnection.ConnectionString);
            }

            throw new ConfigurationErrorsException(
                "Configure FITPULSE_SQL_CONNECTION_STRING or a FitPulseEntities Entity Framework connection string.");
        }
    }

    public partial class FitPulseEntities
    {
        public FitPulseEntities(string connectionString)
            : base(connectionString)
        {
        }
    }
}
