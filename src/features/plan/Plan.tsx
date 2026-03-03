import { useEffect, useState } from 'react';
import type { Meal, PlannedMeal, PlannedWorkout, Workout } from '../../domain/types';
import { load, save, STORAGE_KEYS } from '../../storage/storage';
import { v4 as uuidv4 } from '../../storage/uuid';

type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

function Plan() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);

  useEffect(() => {
    loadData();
    calculateWeekDays();
  }, [currentDate]);

  const loadData = () => {
    setMeals(load<Meal[]>(STORAGE_KEYS.MEALS, []));
    setWorkouts(load<Workout[]>(STORAGE_KEYS.WORKOUTS, []));
    setPlannedMeals(load<PlannedMeal[]>(STORAGE_KEYS.PLANNED_MEALS, []));
    setPlannedWorkouts(load<PlannedWorkout[]>(STORAGE_KEYS.PLANNED_WORKOUTS, []));
  };

  const calculateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    setWeekDays(days);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getMealForSlot = (date: Date, time: MealTime) => {
    const dateStr = formatDate(date);
    return plannedMeals.find(pm => pm.date === dateStr && pm.time === time);
  };

  const getWorkoutForDay = (date: Date) => {
    const dateStr = formatDate(date);
    return plannedWorkouts.find(pw => pw.date === dateStr);
  };

  const addMealToSlot = (date: Date, time: MealTime) => {
    const mealId = prompt(`Select meal (enter meal name):\n\n${meals.map(m => m.name).join('\n')}`);
    if (!mealId) return;

    const meal = meals.find(m => m.name.toLowerCase().includes(mealId.toLowerCase()));
    if (!meal) {
      alert('Meal not found');
      return;
    }

    const dateStr = formatDate(date);
    const existingMeal = getMealForSlot(date, time);
    
    if (existingMeal) {
      // Update existing
      const updated = plannedMeals.map(pm => 
        pm.id === existingMeal.id ? { ...pm, mealId: meal.id } : pm
      );
      setPlannedMeals(updated);
      save(STORAGE_KEYS.PLANNED_MEALS, updated);
    } else {
      // Add new
      const newPlannedMeal: PlannedMeal = {
        id: uuidv4(),
        date: dateStr,
        time,
        mealId: meal.id,
      };
      const updated = [...plannedMeals, newPlannedMeal];
      setPlannedMeals(updated);
      save(STORAGE_KEYS.PLANNED_MEALS, updated);
    }
  };

  const removeMealFromSlot = (plannedMealId: string) => {
    const updated = plannedMeals.filter(pm => pm.id !== plannedMealId);
    setPlannedMeals(updated);
    save(STORAGE_KEYS.PLANNED_MEALS, updated);
  };

  const addWorkoutToDay = (date: Date) => {
    const workoutName = prompt(`Select workout:\n\n${workouts.map(w => w.name).join('\n')}`);
    if (!workoutName) return;

    const workout = workouts.find(w => w.name.toLowerCase().includes(workoutName.toLowerCase()));
    if (!workout) {
      alert('Workout not found');
      return;
    }

    const dateStr = formatDate(date);
    const existingWorkout = getWorkoutForDay(date);
    
    if (existingWorkout) {
      // Update existing
      const updated = plannedWorkouts.map(pw => 
        pw.id === existingWorkout.id ? { ...pw, workoutId: workout.id } : pw
      );
      setPlannedWorkouts(updated);
      save(STORAGE_KEYS.PLANNED_WORKOUTS, updated);
    } else {
      // Add new
      const newPlannedWorkout: PlannedWorkout = {
        id: uuidv4(),
        date: dateStr,
        workoutId: workout.id,
      };
      const updated = [...plannedWorkouts, newPlannedWorkout];
      setPlannedWorkouts(updated);
      save(STORAGE_KEYS.PLANNED_WORKOUTS, updated);
    }
  };

  const removeWorkoutFromDay = (plannedWorkoutId: string) => {
    const updated = plannedWorkouts.filter(pw => pw.id !== plannedWorkoutId);
    setPlannedWorkouts(updated);
    save(STORAGE_KEYS.PLANNED_WORKOUTS, updated);
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div>
      <div className="page-header">
        <h2>Weekly Planner</h2>
        <div className="button-group">
          <button onClick={previousWeek}>← Previous</button>
          <button onClick={goToToday}>Today</button>
          <button onClick={nextWeek}>Next →</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.5rem', borderBottom: '2px solid #333', textAlign: 'left' }}>Time</th>
              {weekDays.map(day => (
                <th key={day.toISOString()} style={{ padding: '0.5rem', borderBottom: '2px solid #333', textAlign: 'center' }}>
                  {formatDisplayDate(day)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealTime[]).map(time => (
              <tr key={time}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{time}</td>
                {weekDays.map(day => {
                  const plannedMeal = getMealForSlot(day, time);
                  const meal = plannedMeal ? meals.find(m => m.id === plannedMeal.mealId) : null;
                  return (
                    <td key={day.toISOString()} style={{ padding: '0.5rem', borderLeft: '1px solid #333', verticalAlign: 'top' }}>
                      {meal && plannedMeal ? (
                        <div style={{ fontSize: '0.9em', padding: '0.5rem', backgroundColor: '#1a1a1a', borderRadius: '4px', border: '1px solid #646cff' }}>
                          <div>{meal.name}</div>
                          <button
                            onClick={() => removeMealFromSlot(plannedMeal.id)}
                            style={{ fontSize: '0.8em', padding: '0.25rem 0.5rem', marginTop: '0.25rem', backgroundColor: '#d32f2f' }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addMealToSlot(day, time)}
                          style={{ fontSize: '0.8em', padding: '0.25rem 0.5rem' }}
                        >
                          + Add
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td style={{ padding: '0.5rem', fontWeight: 'bold', borderTop: '2px solid #333' }}>Workout</td>
              {weekDays.map(day => {
                const plannedWorkout = getWorkoutForDay(day);
                const workout = plannedWorkout ? workouts.find(w => w.id === plannedWorkout.workoutId) : null;
                return (
                  <td key={day.toISOString()} style={{ padding: '0.5rem', borderLeft: '1px solid #333', borderTop: '2px solid #333', verticalAlign: 'top' }}>
                    {workout && plannedWorkout ? (
                      <div style={{ fontSize: '0.9em', padding: '0.5rem', backgroundColor: '#1a1a1a', borderRadius: '4px', border: '1px solid #646cff' }}>
                        <div>{workout.name}</div>
                        <button
                          onClick={() => removeWorkoutFromDay(plannedWorkout.id)}
                          style={{ fontSize: '0.8em', padding: '0.25rem 0.5rem', marginTop: '0.25rem', backgroundColor: '#d32f2f' }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addWorkoutToDay(day)}
                        style={{ fontSize: '0.8em', padding: '0.25rem 0.5rem' }}
                      >
                        + Add
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Plan;
