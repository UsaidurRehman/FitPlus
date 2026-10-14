/*
  Demo catalog data for the React Native food and exercise pickers.
  Apply after FitPulseScript.sql. The checks make this safe to re-run by name.
  Nutrition values are approximate demo values per the stated serving.
*/
SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Barbell Bench Press')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Barbell Bench Press', N'Chest', N'Barbell');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Push-Up')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Push-Up', N'Chest', N'Bodyweight');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Barbell Squat')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Barbell Squat', N'Legs', N'Barbell');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Deadlift')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Deadlift', N'Back', N'Barbell');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Overhead Press')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Overhead Press', N'Shoulders', N'Barbell');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Lat Pulldown')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Lat Pulldown', N'Back', N'Cable');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Seated Cable Row')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Seated Cable Row', N'Back', N'Cable');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Bicep Curl')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Bicep Curl', N'Arms', N'Dumbbell');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Tricep Pushdown')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Tricep Pushdown', N'Arms', N'Cable');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Leg Press')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Leg Press', N'Legs', N'Machine');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Dumbbell Lunge')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Dumbbell Lunge', N'Legs', N'Dumbbell');
IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE Name = N'Plank')
    INSERT dbo.Exercises (Name, MuscleGroup, Equipment) VALUES (N'Plank', N'Core', N'Bodyweight');

IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Rolled Oats')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Rolled Oats', N'100 g', 389.00, 16.90, 66.30, 6.90);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Chicken Breast')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Chicken Breast', N'100 g cooked', 165.00, 31.00, 0.00, 3.60);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Brown Rice')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Brown Rice', N'100 g cooked', 111.00, 2.60, 23.00, 0.90);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Large Egg')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Large Egg', N'1 egg', 72.00, 6.30, 0.40, 4.80);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Banana')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Banana', N'1 medium', 105.00, 1.30, 27.00, 0.40);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Greek Yogurt')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Greek Yogurt', N'100 g', 59.00, 10.00, 3.60, 0.40);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Almonds')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Almonds', N'30 g', 174.00, 6.40, 6.10, 15.00);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Whey Protein')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Whey Protein', N'1 scoop', 120.00, 24.00, 3.00, 1.50);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Salmon')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Salmon', N'100 g cooked', 208.00, 20.40, 0.00, 13.40);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Whole Wheat Bread')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Whole Wheat Bread', N'1 slice', 69.00, 3.60, 11.60, 1.10);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Avocado')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Avocado', N'100 g', 160.00, 2.00, 8.50, 14.70);
IF NOT EXISTS (SELECT 1 FROM dbo.FoodItems WHERE Name = N'Sweet Potato')
    INSERT dbo.FoodItems (Name, ServingSizeUnit, Calories, ProteinGrams, CarbsGrams, FatGrams)
    VALUES (N'Sweet Potato', N'100 g cooked', 90.00, 2.00, 20.70, 0.20);
