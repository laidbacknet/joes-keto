import { supabase } from '../../lib/supabase';
import type { Meal, Ingredient, StarterMeal } from '../../domain/types';

// ─── DB row shapes ────────────────────────────────────────────────────────────

interface DbIngredient {
  id: string;
  meal_id: string;
  name: string;
  quantity: string | null;
  store: string | null;
  notes: string | null;
  sort_order: number;
}

interface DbMeal {
  id: string;
  user_id: string;
  source_starter_meal_id: string | null;
  name: string;
  description: string | null;
  tags: string[];
  prep_time_mins: number | null;
  cook_time_mins: number | null;
  instructions: string[];
  created_at: string;
  updated_at: string;
  meal_ingredients: DbIngredient[];
}

interface DbStarterIngredient {
  id: string;
  starter_meal_id: string;
  name: string;
  quantity: string | null;
  store: string | null;
  notes: string | null;
  sort_order: number;
}

interface DbStarterMeal {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: string[];
  prep_time_mins: number | null;
  cook_time_mins: number | null;
  instructions: string[];
  starter_meal_ingredients: DbStarterIngredient[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function dbIngredientToDomain(ing: DbIngredient): Ingredient {
  return {
    id: ing.id,
    name: ing.name,
    quantity: ing.quantity ?? undefined,
    store: ing.store ?? undefined,
    notes: ing.notes ?? undefined,
  };
}

function dbMealToDomain(row: DbMeal): Meal {
  return {
    id: row.id,
    name: row.name,
    tags: row.tags ?? [],
    ingredients: [...(row.meal_ingredients ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(dbIngredientToDomain),
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    prepTimeMins: row.prep_time_mins ?? undefined,
    cookTimeMins: row.cook_time_mins ?? undefined,
    sourceStarterMealId: row.source_starter_meal_id ?? undefined,
  };
}

function dbStarterMealToDomain(row: DbStarterMeal): StarterMeal {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    prepTimeMins: row.prep_time_mins ?? undefined,
    cookTimeMins: row.cook_time_mins ?? undefined,
    instructions: Array.isArray(row.instructions) ? row.instructions : [],
    ingredients: [...(row.starter_meal_ingredients ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(ing => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity ?? undefined,
        store: ing.store ?? undefined,
        notes: ing.notes ?? undefined,
      })),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getStarterMeals(): Promise<StarterMeal[]> {
  const { data, error } = await supabase
    .from('starter_meals')
    .select('*, starter_meal_ingredients(*)')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as DbStarterMeal[]).map(dbStarterMealToDomain);
}

export async function getMealsForUser(): Promise<Meal[]> {
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_ingredients(*)')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as DbMeal[]).map(dbMealToDomain);
}

export async function createMeal(
  meal: Omit<Meal, 'id'> & { userId: string }
): Promise<Meal> {
  const { data: mealRow, error: mealError } = await supabase
    .from('meals')
    .insert({
      user_id: meal.userId,
      name: meal.name,
      tags: meal.tags ?? [],
      prep_time_mins: meal.prepTimeMins ?? null,
      cook_time_mins: meal.cookTimeMins ?? null,
      instructions: meal.instructions,
      source_starter_meal_id: meal.sourceStarterMealId ?? null,
    })
    .select()
    .single();

  if (mealError) throw mealError;

  if (meal.ingredients.length > 0) {
    const { error: ingError } = await supabase
      .from('meal_ingredients')
      .insert(
        meal.ingredients.map((ing, idx) => ({
          meal_id: mealRow.id,
          name: ing.name,
          quantity: ing.quantity ?? null,
          store: ing.store ?? null,
          notes: ing.notes ?? null,
          sort_order: idx,
        }))
      );
    if (ingError) throw ingError;
  }

  return getMealById(mealRow.id);
}

export async function updateMeal(meal: Meal): Promise<Meal> {
  const { error: mealError } = await supabase
    .from('meals')
    .update({
      name: meal.name,
      tags: meal.tags ?? [],
      prep_time_mins: meal.prepTimeMins ?? null,
      cook_time_mins: meal.cookTimeMins ?? null,
      instructions: meal.instructions,
    })
    .eq('id', meal.id);

  if (mealError) throw mealError;

  // Replace ingredients: delete existing, re-insert
  const { error: delError } = await supabase
    .from('meal_ingredients')
    .delete()
    .eq('meal_id', meal.id);
  if (delError) throw delError;

  if (meal.ingredients.length > 0) {
    const { error: ingError } = await supabase
      .from('meal_ingredients')
      .insert(
        meal.ingredients.map((ing, idx) => ({
          meal_id: meal.id,
          name: ing.name,
          quantity: ing.quantity ?? null,
          store: ing.store ?? null,
          notes: ing.notes ?? null,
          sort_order: idx,
        }))
      );
    if (ingError) throw ingError;
  }

  return getMealById(meal.id);
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw error;
}

export async function getMealById(id: string): Promise<Meal> {
  const { data, error } = await supabase
    .from('meals')
    .select('*, meal_ingredients(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return dbMealToDomain(data as DbMeal);
}

/**
 * Copy selected starter meals (and their ingredients) into the current user's
 * meal library. Preserves source_starter_meal_id for traceability.
 */
export async function importStarterMealsForUser(
  starterMealIds: string[],
  userId: string
): Promise<void> {
  if (starterMealIds.length === 0) return;

  const { data, error } = await supabase
    .from('starter_meals')
    .select('*, starter_meal_ingredients(*)')
    .in('id', starterMealIds);

  if (error) throw error;

  const starterMeals = (data as DbStarterMeal[]).map(dbStarterMealToDomain);

  await Promise.all(
    starterMeals.map(sm =>
      createMeal({
        userId,
        name: sm.name,
        tags: sm.tags,
        ingredients: sm.ingredients,
        instructions: sm.instructions,
        prepTimeMins: sm.prepTimeMins,
        cookTimeMins: sm.cookTimeMins,
        sourceStarterMealId: sm.id,
      })
    )
  );
}

/**
 * Mark the user's onboarding as completed.
 */
export async function completeOnboarding(userId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ has_completed_onboarding: true })
    .eq('id', userId);
  if (error) throw error;
}
