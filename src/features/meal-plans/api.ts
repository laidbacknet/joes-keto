import { supabase } from '../../lib/supabase';
import type { MealPlan, MealPlanItem, MealSlot } from '../../domain/types';

// ─── DB row shapes ────────────────────────────────────────────────────────────

interface DbMealPlanItem {
  id: string;
  meal_plan_id: string;
  meal_id: string;
  day_of_week: number;
  meal_slot: string;
  servings: number;
  sort_order: number;
  created_at: string;
}

interface DbMealPlan {
  id: string;
  user_id: string;
  name: string;
  week_start: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  meal_plan_items: DbMealPlanItem[];
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function dbItemToDomain(row: DbMealPlanItem): MealPlanItem {
  return {
    id: row.id,
    mealPlanId: row.meal_plan_id,
    mealId: row.meal_id,
    dayOfWeek: row.day_of_week,
    mealSlot: row.meal_slot as MealSlot,
    servings: Number(row.servings),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function dbPlanToDomain(row: DbMealPlan): MealPlan {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    weekStart: row.week_start ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: [...(row.meal_plan_items ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(dbItemToDomain),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getMealPlans(): Promise<MealPlan[]> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*, meal_plan_items(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as DbMealPlan[]).map(dbPlanToDomain);
}

export async function getMealPlanById(id: string): Promise<MealPlan> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*, meal_plan_items(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return dbPlanToDomain(data as DbMealPlan);
}

export async function createMealPlan(
  userId: string,
  name: string,
  weekStart?: string
): Promise<MealPlan> {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      name,
      week_start: weekStart ?? null,
    })
    .select('*, meal_plan_items(*)')
    .single();

  if (error) throw error;
  return dbPlanToDomain(data as DbMealPlan);
}

export async function updateMealPlanName(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('meal_plans')
    .update({ name })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMealPlan(id: string): Promise<void> {
  const { error } = await supabase.from('meal_plans').delete().eq('id', id);
  if (error) throw error;
}

export async function addMealPlanItem(
  mealPlanId: string,
  mealId: string,
  dayOfWeek: number,
  mealSlot: MealSlot,
  servings: number
): Promise<MealPlanItem> {
  const { data, error } = await supabase
    .from('meal_plan_items')
    .insert({
      meal_plan_id: mealPlanId,
      meal_id: mealId,
      day_of_week: dayOfWeek,
      meal_slot: mealSlot,
      servings,
      sort_order: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return dbItemToDomain(data as DbMealPlanItem);
}

export async function updateMealPlanItemServings(
  itemId: string,
  servings: number
): Promise<void> {
  const { error } = await supabase
    .from('meal_plan_items')
    .update({ servings })
    .eq('id', itemId);

  if (error) throw error;
}

export async function removeMealPlanItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('meal_plan_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
