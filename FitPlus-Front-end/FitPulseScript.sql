CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(256) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE UserMetrics (
    MetricId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    WeightKg DECIMAL(5,2) NOT NULL,
    DailyCalorieTarget INT NOT NULL,
    LoggedAt DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE Exercises (
    ExerciseId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    MuscleGroup NVARCHAR(50) NOT NULL,
    Equipment NVARCHAR(50) NULL
);

CREATE TABLE WorkoutLogs (
    WorkoutLogId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    DurationMinutes INT NOT NULL,
    LoggedAt DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE WorkoutSets (
    SetId INT IDENTITY(1,1) PRIMARY KEY,
    WorkoutLogId INT NOT NULL,
    ExerciseId INT NOT NULL,
    SetNumber INT NOT NULL,
    Reps INT NOT NULL,
    WeightKg DECIMAL(5,2) NOT NULL,

    FOREIGN KEY (WorkoutLogId) REFERENCES WorkoutLogs(WorkoutLogId),
    FOREIGN KEY (ExerciseId) REFERENCES Exercises(ExerciseId)
);





CREATE TABLE FoodItems (
    FoodItemId INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    ServingSizeUnit NVARCHAR(50) NOT NULL,
    Calories DECIMAL(6,2) NOT NULL,
    ProteinGrams DECIMAL(5,2) NOT NULL,
    CarbsGrams DECIMAL(5,2) NOT NULL,
    FatGrams DECIMAL(5,2) NOT NULL
);

CREATE TABLE MealLogs (
    MealLogId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    MealType NVARCHAR(50) NOT NULL,
    LoggedAt DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

CREATE TABLE MealItems (
    MealItemId INT IDENTITY(1,1) PRIMARY KEY,
    MealLogId INT NOT NULL,
    FoodItemId INT NOT NULL,
    Servings DECIMAL(4,2) NOT NULL,

    FOREIGN KEY (MealLogId) REFERENCES MealLogs(MealLogId),
    FOREIGN KEY (FoodItemId) REFERENCES FoodItems(FoodItemId)
);




select * from Users