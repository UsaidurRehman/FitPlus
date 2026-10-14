// Types that match the back-end response shapes exactly.
// Keep these simple — they are what the screens consume.

// --- Auth ---
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

// --- Exercises ---
export interface Exercise {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  equipment: string | null;
}

// --- Workouts ---
export interface WorkoutSetInput {
  exerciseId: number;
  setNumber: number;
  reps: number;
  weight: number;
}

export interface WorkoutLogInput {
  title: string;
  durationMinutes: number;
  loggedAt?: string;
  sets: WorkoutSetInput[];
}

// --- Food ---
export interface FoodItem {
  foodItemId: number;
  name: string;
  servingSizeUnit: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface MealItemInput {
  foodItemId: number;
  servings: number;
}

export interface MealLogInput {
  mealType: string;
  loggedAt?: string;
  items: MealItemInput[];
}

// --- Dashboard ---
export interface DailySummary {
  date: string;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalWorkouts: number;
  totalWorkoutDurationMinutes: number;
  totalMealLogs: number;
}
