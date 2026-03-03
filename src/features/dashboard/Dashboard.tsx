import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Meal, PlannedMeal, PlannedWorkout, Workout } from '../../domain/types';
import { load, STORAGE_KEYS } from '../../storage/storage';

function Dashboard() {
  const [todaysMeals, setTodaysMeals] = useState<{ meal: Meal; planned: PlannedMeal }[]>([]);
  const [todaysWorkout, setTodaysWorkout] = useState<{ workout: Workout; planned: PlannedWorkout } | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    const meals = load<Meal[]>(STORAGE_KEYS.MEALS, []);
    const plannedMeals = load<PlannedMeal[]>(STORAGE_KEYS.PLANNED_MEALS, []);
    const workouts = load<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
    const plannedWorkouts = load<PlannedWorkout[]>(STORAGE_KEYS.PLANNED_WORKOUTS, []);
    
    // Get today's meals
    const todayPlanned = plannedMeals.filter(pm => pm.date === today);
    const mealsWithDetails = todayPlanned
      .map(pm => {
        const meal = meals.find(m => m.id === pm.mealId);
        return meal ? { meal, planned: pm } : null;
      })
      .filter((item): item is { meal: Meal; planned: PlannedMeal } => item !== null)
      .sort((a, b) => {
        const timeOrder = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
        return timeOrder[a.planned.time] - timeOrder[b.planned.time];
      });
    
    setTodaysMeals(mealsWithDetails);
    
    // Get today's workout
    const todayWorkoutPlanned = plannedWorkouts.find(pw => pw.date === today);
    if (todayWorkoutPlanned) {
      const workout = workouts.find(w => w.id === todayWorkoutPlanned.workoutId);
      if (workout) {
        setTodaysWorkout({ workout, planned: todayWorkoutPlanned });
      }
    }
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <div className="button-group">
          <Link to="/plan">
            <button>Plan Week</button>
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>Today's Meals</h3>
        {todaysMeals.length === 0 ? (
          <p>No meals planned for today. <Link to="/plan">Plan your meals</Link></p>
        ) : (
          <div>
            {todaysMeals.map(({ meal, planned }) => (
              <div key={planned.id} style={{ marginBottom: '1rem', padding: '0.5rem', borderLeft: '3px solid #646cff' }}>
                <strong>{planned.time.charAt(0).toUpperCase() + planned.time.slice(1)}</strong>: {meal.name}
                {planned.notes && <div style={{ fontSize: '0.9em', color: '#888' }}>{planned.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Today's Workout</h3>
        {!todaysWorkout ? (
          <p>No workout planned for today. <Link to="/workouts">Schedule a workout</Link></p>
        ) : (
          <div>
            <h4>{todaysWorkout.workout.name}</h4>
            {todaysWorkout.planned.time && <p>Time: {todaysWorkout.planned.time}</p>}
            {todaysWorkout.planned.notes && <p style={{ color: '#888' }}>{todaysWorkout.planned.notes}</p>}
            <ul style={{ marginTop: '1rem', textAlign: 'left' }}>
              {todaysWorkout.workout.exercises.slice(0, 3).map(ex => (
                <li key={ex.id}>
                  {ex.name} - {ex.sets}x{ex.reps}
                </li>
              ))}
              {todaysWorkout.workout.exercises.length > 3 && (
                <li style={{ color: '#888' }}>...and {todaysWorkout.workout.exercises.length - 3} more</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Quick Links</h3>
        <div className="button-group">
          <Link to="/meals"><button>Browse Meals</button></Link>
          <Link to="/shopping"><button>Shopping List</button></Link>
          <Link to="/workouts"><button>Browse Workouts</button></Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
