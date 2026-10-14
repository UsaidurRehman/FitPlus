# FitPulse

A simple fitness tracker built with **React Native + Expo** (front-end) and **ASP.NET Web API + SQL Server** (back-end).

## Folder structure

```
FitPlus/
├── App.tsx                 # Root component (entry point)
├── app.json                # Expo config
├── assets/                 # Images, icons
├── src/
│   ├── api/                # All HTTP calls live here
│   │   ├── api.ts          # Axios client + base URL setup
│   │   ├── endpoints.ts    # One function per back-end route
│   │   └── types.ts        # Types matching the back-end JSON
│   ├── components/         # Reusable UI pieces (Button, Card, Input…)
│   ├── constants/          # Colors, spacing, radius (theme)
│   ├── navigation/         # The single AppNavigator file
│   ├── screens/            # One file per screen
│   ├── store/              # Zustand stores (currently just auth)
│   └── utils/              # Helpers and storage
└── tsconfig.json
```

## Run the app

```bash
npm install
npx expo start
```

The app talks to the back-end at `https://localhost:44391/api` (Android emulator uses `10.0.2.2`).

## Tech stack

- **React Native 0.86** on **Expo SDK 57**
- **TypeScript** (strict mode)
- **Zustand** for state
- **Axios** for HTTP
- **expo-secure-store** for saving the JWT
- **React Navigation 7** (native stack + bottom tabs)

## Screens

| Screen       | What it does                                    |
|--------------|-------------------------------------------------|
| Login        | Email + password sign in                        |
| Register     | Create a new account                            |
| Dashboard    | Today's calories, macros, and activity          |
| Workouts     | Build a workout, pick exercises, log sets       |
| Meals        | Pick a meal type, add foods, set servings       |
| Analytics    | Daily totals (placeholder for weekly charts)    |
| Profile      | Account info + logout                           |

## Back-end

The back-end lives in the `Back-end` branch and is an ASP.NET Web API project with Entity Framework 5 and a SQL Server database. See `FitPulseScript.sql` for the schema and `SeedData.sql` for the default rows.
