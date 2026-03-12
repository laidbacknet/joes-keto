import { useEffect, useState } from "react";
import type { MealPlan, MealPlanItem, MealSlot, Meal } from "../../domain/types";
import {
  getMealPlans,
  createMealPlan,
  deleteMealPlan,
  addMealPlanItem,
  updateMealPlanItemServings,
  removeMealPlanItem,
  updateMealPlanName,
} from "./api";
import { getMealsForUser } from "../meals/api";
import { useAuth } from "../../context/AuthProvider";
import "./MealPlansPage.css";

const MEAL_SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_PLAN_NAME = "My Meal Plan";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddItemModalState {
  dayOfWeek: number;
  mealSlot: MealSlot;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MealPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState<AddItemModalState | null>(null);
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState(DEFAULT_PLAN_NAME);
  const [newPlanWeekStart, setNewPlanWeekStart] = useState(getThisMonday());
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedPlans, fetchedMeals] = await Promise.all([
        getMealPlans(),
        getMealsForUser(),
      ]);
      setPlans(fetchedPlans);
      setMeals(fetchedMeals);
      if (fetchedPlans.length > 0 && !activePlanId) {
        setActivePlanId(fetchedPlans[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const activePlan = plans.find(p => p.id === activePlanId) ?? null;

  // ─── Plan CRUD ──────────────────────────────────────────────────────────────

  const handleCreatePlan = async () => {
    if (!user) return;
    try {
      const plan = await createMealPlan(user.id, newPlanName.trim() || DEFAULT_PLAN_NAME, newPlanWeekStart || undefined);
      setPlans(prev => [plan, ...prev]);
      setActivePlanId(plan.id);
      setShowNewPlanForm(false);
      setNewPlanName(DEFAULT_PLAN_NAME);
      setNewPlanWeekStart(getThisMonday());
    } catch (err) {
      console.error(err);
      alert("Failed to create meal plan. Please try again.");
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Delete this meal plan and all its items?")) return;
    try {
      await deleteMealPlan(planId);
      const remaining = plans.filter(p => p.id !== planId);
      setPlans(remaining);
      setActivePlanId(remaining.length > 0 ? remaining[0].id : null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete meal plan.");
    }
  };

  const handleStartEditName = () => {
    if (!activePlan) return;
    setEditNameValue(activePlan.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!activePlan) return;
    const trimmed = editNameValue.trim();
    if (!trimmed) return;
    try {
      await updateMealPlanName(activePlan.id, trimmed);
      setPlans(prev => prev.map(p => p.id === activePlan.id ? { ...p, name: trimmed } : p));
      setEditingName(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update plan name.");
    }
  };

  // ─── Item CRUD ──────────────────────────────────────────────────────────────

  const handleAddItem = (dayOfWeek: number, mealSlot: MealSlot) => {
    setAddModal({ dayOfWeek, mealSlot });
  };

  const handleSaveItem = async (mealId: string, servings: number) => {
    if (!activePlan) return;
    try {
      const item = await addMealPlanItem(
        activePlan.id,
        mealId,
        addModal!.dayOfWeek,
        addModal!.mealSlot,
        servings
      );
      setPlans(prev =>
        prev.map(p =>
          p.id === activePlan.id
            ? { ...p, items: [...p.items, item] }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to add meal to plan.");
    }
    setAddModal(null);
  };

  const handleUpdateServings = async (item: MealPlanItem, servings: number) => {
    try {
      await updateMealPlanItemServings(item.id, servings);
      setPlans(prev =>
        prev.map(p =>
          p.id === activePlanId
            ? { ...p, items: p.items.map(i => i.id === item.id ? { ...i, servings } : i) }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update servings.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("Remove this meal from the plan?")) return;
    try {
      await removeMealPlanItem(itemId);
      setPlans(prev =>
        prev.map(p =>
          p.id === activePlanId
            ? { ...p, items: p.items.filter(i => i.id !== itemId) }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to remove meal.");
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getItemsForSlot = (dayOfWeek: number, mealSlot: MealSlot): MealPlanItem[] => {
    if (!activePlan) return [];
    return activePlan.items.filter(
      i => i.dayOfWeek === dayOfWeek && i.mealSlot === mealSlot
    );
  };

  const getMealName = (mealId: string): string =>
    meals.find(m => m.id === mealId)?.name ?? "Unknown meal";

  if (loading) {
    return <div className="meal-plans-page"><p className="loading-msg">Loading meal plans…</p></div>;
  }

  return (
    <div className="meal-plans-page">
      {/* Header */}
      <div className="mpl-header">
        <h1>🗓️ Meal Plans</h1>
        <button className="btn btn-primary" onClick={() => setShowNewPlanForm(true)}>
          + New Plan
        </button>
      </div>

      {/* New plan form */}
      {showNewPlanForm && (
        <div className="new-plan-form">
          <h2>Create New Meal Plan</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plan-name">Plan Name</label>
              <input
                id="plan-name"
                type="text"
                value={newPlanName}
                onChange={e => setNewPlanName(e.target.value)}
                placeholder="My Meal Plan"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="week-start">Week Starting</label>
              <input
                id="week-start"
                type="date"
                value={newPlanWeekStart}
                onChange={e => setNewPlanWeekStart(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleCreatePlan}>Create</button>
            <button className="btn" onClick={() => setShowNewPlanForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Plan selector */}
      {plans.length > 0 && (
        <div className="plan-selector">
          {plans.map(plan => (
            <button
              key={plan.id}
              className={`plan-tab${plan.id === activePlanId ? " active" : ""}`}
              onClick={() => setActivePlanId(plan.id)}
            >
              {plan.name}
              {plan.weekStart && <span className="plan-tab-week"> · {formatWeekLabel(plan.weekStart)}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {plans.length === 0 && (
        <div className="empty-state">
          <p>No meal plans yet. Create your first plan to get started!</p>
        </div>
      )}

      {/* Active plan */}
      {activePlan && (
        <>
          {/* Plan title & actions */}
          <div className="plan-title-row">
            {editingName ? (
              <div className="edit-name-row">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={e => setEditNameValue(e.target.value)}
                  className="form-input"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button className="btn btn-primary" onClick={handleSaveName}>Save</button>
                <button className="btn" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <>
                <h2 className="plan-title">
                  {activePlan.name}
                  {activePlan.weekStart && (
                    <span className="plan-week-label"> — week of {formatWeekLabel(activePlan.weekStart)}</span>
                  )}
                </h2>
                <div className="plan-actions">
                  <button className="btn btn-sm" onClick={handleStartEditName}>✏️ Rename</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeletePlan(activePlan.id)}>🗑️ Delete</button>
                </div>
              </>
            )}
          </div>

          {/* Weekly grid */}
          {meals.length === 0 ? (
            <p className="info-msg">You have no meals yet. <a href="/meals">Add meals</a> first to build your plan.</p>
          ) : (
            <div className="grid-wrapper">
              <div className="plan-grid">
                {/* Header row */}
                <div className="grid-header">
                  <div className="slot-col">Slot</div>
                  {DAYS_OF_WEEK.map((day, i) => (
                    <div key={i} className="day-col">{day}</div>
                  ))}
                </div>

                {/* Rows for each meal slot */}
                {MEAL_SLOTS.map(slot => (
                  <div key={slot} className="grid-row">
                    <div className="slot-cell">{slot}</div>
                    {DAYS_FULL.map((_, dayIdx) => {
                      const items = getItemsForSlot(dayIdx, slot);
                      return (
                        <div key={dayIdx} className="meal-cell">
                          {items.map(item => (
                            <div key={item.id} className="plan-item">
                              <div className="item-name">{getMealName(item.mealId)}</div>
                              <div className="item-controls">
                                <button
                                  className="servings-btn"
                                  onClick={() => {
                                    const next = Math.max(0.5, item.servings - 0.5);
                                    handleUpdateServings(item, next);
                                  }}
                                  aria-label="Decrease servings"
                                >−</button>
                                <span className="servings-value">{item.servings}x</span>
                                <button
                                  className="servings-btn"
                                  onClick={() => handleUpdateServings(item, item.servings + 0.5)}
                                  aria-label="Increase servings"
                                >+</button>
                                <button
                                  className="remove-btn"
                                  onClick={() => handleRemoveItem(item.id)}
                                  aria-label="Remove meal"
                                >✕</button>
                              </div>
                            </div>
                          ))}
                          <button
                            className="add-btn"
                            onClick={() => handleAddItem(dayIdx, slot)}
                          >
                            + Add
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add item modal */}
      {addModal && (
        <AddItemModal
          dayLabel={DAYS_FULL[addModal.dayOfWeek]}
          slot={addModal.mealSlot}
          meals={meals}
          onSave={handleSaveItem}
          onCancel={() => setAddModal(null)}
        />
      )}
    </div>
  );
}

// ─── Add Item Modal ───────────────────────────────────────────────────────────

interface AddItemModalProps {
  dayLabel: string;
  slot: MealSlot;
  meals: Meal[];
  onSave: (mealId: string, servings: number) => void;
  onCancel: () => void;
}

function AddItemModal({ dayLabel, slot, meals, onSave, onCancel }: AddItemModalProps) {
  const [selectedMealId, setSelectedMealId] = useState("");
  const [servings, setServings] = useState(1);

  const handleSave = () => {
    if (!selectedMealId) {
      alert("Please select a meal.");
      return;
    }
    if (servings <= 0) {
      alert("Servings must be greater than 0.");
      return;
    }
    onSave(selectedMealId, servings);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Meal</h2>
        <p className="modal-context">{dayLabel} · {slot}</p>

        <div className="form-group">
          <label htmlFor="meal-select">Meal</label>
          <select
            id="meal-select"
            value={selectedMealId}
            onChange={e => setSelectedMealId(e.target.value)}
            className="form-select"
          >
            <option value="">— Choose a meal —</option>
            {meals.map(meal => (
              <option key={meal.id} value={meal.id}>{meal.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="servings-input">Servings</label>
          <input
            id="servings-input"
            type="number"
            min="0.5"
            step="0.5"
            value={servings}
            onChange={e => setServings(Number(e.target.value))}
            className="form-input servings-input"
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSave}>Add</button>
          <button className="btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getThisMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
