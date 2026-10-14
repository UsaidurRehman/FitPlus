// One file with every API call the app makes.
// Screens import these functions instead of using axios directly.

import { api } from './api';
import {
  AuthResponse,
  DailySummary,
  Exercise,
  FoodItem,
  LoginInput,
  MealLogInput,
  RegisterInput,
  User,
  WorkoutLogInput,
} from './types';

// --- Auth ---
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await api.post('/Auth/Login', input);
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post('/Auth/Register', input);
  return data;
}

export async function me(): Promise<User> {
  const { data } = await api.get('/Auth/Me');
  return data;
}

// --- Dashboard ---
export async function getDailySummary(date: string): Promise<DailySummary> {
  const { data } = await api.get(`/Dashboard/DailySummary?date=${date}`);
  return data;
}

// --- Workouts ---
export async function getExercises(): Promise<Exercise[]> {
  const { data } = await api.get('/Workouts/Exercises');
  return data;
}

export async function logWorkout(input: WorkoutLogInput): Promise<void> {
  await api.post('/Workouts/Log', input);
}

// --- Meals ---
export async function getFoodItems(): Promise<FoodItem[]> {
  const { data } = await api.get('/Meals/FoodItems');
  return data;
}

export async function logMeal(input: MealLogInput): Promise<void> {
  await api.post('/Meals/Log', input);
}
