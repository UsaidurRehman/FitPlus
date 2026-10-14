# FitPulse backend setup and API contract

This is the ASP.NET Web API 2 / EF5 backend consumed by the Expo app on the `Front-end` branch.

## Local configuration

Set these values in the environment of the IIS Express process before starting Visual Studio:

- `FITPULSE_SQL_CONNECTION_STRING`: a SQL Server **provider** connection string for the `FitPulse` database. Use a dedicated least-privilege SQL account (or integrated security); do not commit credentials.
- `FITPULSE_JWT_KEY`: a random secret of at least 32 UTF-8 bytes. Keep the same key across app instances. It is intentionally not stored in this repository.
- Optional: `FITPULSE_JWT_ISSUER` and `FITPULSE_JWT_AUDIENCE`. Defaults are `FitPulse` and `FitPulse.Mobile`.
- Optional: `FITPULSE_TIME_ZONE_ID` (or `FitPulse:TimeZoneId` in `Web.config`) for the calendar zone used by daily summaries. It defaults to the server's local zone; configure it to match the app's users because the current front-end sends a date without a timezone offset. On this .NET Framework/Windows host, use a Windows time-zone ID.

Alternatively, the JWT issuer/audience can be set in `Web.config`; the key can be supplied there as `Jwt:Key` only in a private, deployment-specific configuration. The database can also be provided as a full `FitPulseEntities` Entity Framework connection string through the normal .NET connection-string configuration.

To create a local database, run `FitPulseScript.sql` from the `Front-end` branch, then run [`SeedData.sql`](SeedData.sql) to populate the food and exercise catalogs used by the app. The seed values are examples; food nutrition values are approximate.

The Expo client defaults to `https://localhost:44391/api`, matching this project's IIS Express SSL port. It can override that base URL with `EXPO_PUBLIC_API_URL`.

## Routes used by the app

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/Auth/Login` | No | Accepts `{ email, password }`; returns `{ token, user: { id, name, email } }` |
| `POST` | `/api/Auth/Register` | No | Accepts `{ fullName, email, password }`; returns the same auth response |
| `GET` | `/api/Auth/Me` | Bearer JWT | Returns `{ id, name, email }` for session restoration |
| `GET` | `/api/Meals/FoodItems` | No | Returns the flat food catalog expected by `FoodItem` |
| `POST` | `/api/Meals/Log` | Bearer JWT | Accepts `{ mealType, loggedAt?, items: [{ foodItemId, servings }] }` |
| `GET` | `/api/Workouts/Exercises` | No | Returns the flat exercise catalog expected by `Exercise` |
| `POST` | `/api/Workouts/Log` | Bearer JWT | Accepts `{ title, durationMinutes, loggedAt?, sets: [{ exerciseId, setNumber, reps, weight }] }` |
| `GET` | `/api/Dashboard/DailySummary?date=YYYY-MM-DD` | Bearer JWT | Returns the daily totals consumed by Dashboard and Analytics |

JSON responses use camel-case property names. Passwords are stored using PBKDF2; legacy plaintext rows from the earlier backend are re-hashed after a successful login. Dormant legacy accounts should be required to reset their passwords before production use.
