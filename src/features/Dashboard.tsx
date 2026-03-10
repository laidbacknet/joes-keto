import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PlannedMeal, Meal } from "../domain/types";
import { getPlannedMeals } from "./planner/api";
import { getMealsForUser } from "./meals/api";
import "./Dashboard.css";

export default function Dashboard() {
  const [todaysMeals, setTodaysMeals] = useState<Array<PlannedMeal & { meal?: Meal }>>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([getPlannedMeals(), getMealsForUser()])
      .then(([plannedMeals, allMeals]) => {
        const mealMap = new Map(allMeals.map(m => [m.id, m]));
        setTodaysMeals(
          plannedMeals
            .filter(pm => pm.date === today)
            .map(pm => ({ ...pm, meal: mealMap.get(pm.mealId) }))
        );
      })
      .catch(console.error);
  }, []);

  const formatMealTime = (time: string) => {
    return time.charAt(0).toUpperCase() + time.slice(1);
  };

  return (
    <div className="dashboard">
      <h1>Today's Plan</h1>
      <p className="date">{new Date().toLocaleDateString('en-AU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <h2>🍽️ Meals</h2>
          {todaysMeals.length === 0 ? (
            <p className="empty-message">No meals planned for today</p>
          ) : (
            <div className="items-list">
              {todaysMeals.map(pm => (
                <div key={pm.id} className="item-card">
                  <div className="item-time">{formatMealTime(pm.time)}</div>
                  <div className="item-name">{pm.meal?.name || "Unknown meal"}</div>
                  {pm.notes && <div className="item-notes">{pm.notes}</div>}
                </div>
              ))}
            </div>
          )}
          <Link to="/plan" className="section-link">View Weekly Plan →</Link>
        </section>
      </div>

      <section className="quick-links">
        <h2>Quick Actions</h2>
        <div className="button-group">
          <Link to="/meals" className="btn btn-primary">Browse Meals</Link>
          <Link to="/shopping" className="btn btn-primary">Shopping List</Link>
          <Link to="/plan" className="btn btn-primary">Plan Week</Link>
        </div>
      </section>
    </div>
  );
}
