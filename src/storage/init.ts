import type { Meal, Workout, PlannedMeal, PlannedWorkout } from '../domain/types';
import { load, save, STORAGE_KEYS, checkAndMigrateStorage } from './storage';
import { getSeedMeals, getSeedWorkouts } from './seedData';

export function initializeStorage(): void {
  checkAndMigrateStorage();
  
  // Check if storage is empty and seed if necessary
  const meals = load<Meal[]>(STORAGE_KEYS.MEALS, []);
  const workouts = load<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
  
  if (meals.length === 0) {
    const seedMeals = getSeedMeals();
    save(STORAGE_KEYS.MEALS, seedMeals);
    console.log('Seeded meals:', seedMeals.length);
  }
  
  if (workouts.length === 0) {
    const seedWorkouts = getSeedWorkouts();
    save(STORAGE_KEYS.WORKOUTS, seedWorkouts);
    console.log('Seeded workouts:', seedWorkouts.length);
  }
  
  // Initialize other storage keys if they don't exist
  const plannedMeals = load<PlannedMeal[]>(STORAGE_KEYS.PLANNED_MEALS, []);
  if (plannedMeals.length === 0) {
    save(STORAGE_KEYS.PLANNED_MEALS, []);
  }
  
  const plannedWorkouts = load<PlannedWorkout[]>(STORAGE_KEYS.PLANNED_WORKOUTS, []);
  if (plannedWorkouts.length === 0) {
    save(STORAGE_KEYS.PLANNED_WORKOUTS, []);
  }
  
  const shoppingItems = load<any[]>(STORAGE_KEYS.SHOPPING_MANUAL_ITEMS, []);
  if (shoppingItems.length === 0) {
    save(STORAGE_KEYS.SHOPPING_MANUAL_ITEMS, []);
  }
}
