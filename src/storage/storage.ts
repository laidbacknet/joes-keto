export const STORAGE_VERSION = '1.0.0';

export const STORAGE_KEYS = {
  MEALS: 'jk_meals',
  PLANNED_MEALS: 'jk_plannedMeals',
  WORKOUTS: 'jk_workouts',
  PLANNED_WORKOUTS: 'jk_plannedWorkouts',
  SHOPPING_MANUAL_ITEMS: 'jk_shoppingManualItems',
  VERSION: 'jk_version',
} as const;

export function load<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return fallback;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export function checkAndMigrateStorage(): void {
  const currentVersion = load<string>(STORAGE_KEYS.VERSION, '');
  
  if (currentVersion !== STORAGE_VERSION) {
    // Placeholder for future migrations
    console.log(`Storage version: ${currentVersion || 'none'} -> ${STORAGE_VERSION}`);
    save(STORAGE_KEYS.VERSION, STORAGE_VERSION);
  }
}
