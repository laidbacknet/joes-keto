import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Workout } from '../../domain/types';
import { load, save, STORAGE_KEYS } from '../../storage/storage';

function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = () => {
    const loadedWorkouts = load<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
    setWorkouts(loadedWorkouts);
  };

  const deleteWorkout = (id: string) => {
    if (confirm('Are you sure you want to delete this workout?')) {
      const updatedWorkouts = workouts.filter(w => w.id !== id);
      save(STORAGE_KEYS.WORKOUTS, updatedWorkouts);
      setWorkouts(updatedWorkouts);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Workouts</h2>
        <Link to="/workouts/new">
          <button>Add New Workout</button>
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p>No workouts yet. Add your first workout to get started!</p>
      ) : (
        <div>
          {workouts.map(workout => (
            <div key={workout.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>{workout.name}</h3>
                  <p style={{ color: '#888', margin: '0.5rem 0' }}>
                    {workout.exercises.length} exercises
                  </p>
                  <ul style={{ marginTop: '1rem' }}>
                    {workout.exercises.slice(0, 3).map(ex => (
                      <li key={ex.id}>
                        {ex.name} - {ex.sets}x{ex.reps} {ex.load && `@ ${ex.load}`}
                      </li>
                    ))}
                    {workout.exercises.length > 3 && (
                      <li style={{ color: '#888' }}>...and {workout.exercises.length - 3} more</li>
                    )}
                  </ul>
                </div>
                <div className="button-group">
                  <Link to={`/workouts/${workout.id}`}>
                    <button>Edit</button>
                  </Link>
                  <button onClick={() => deleteWorkout(workout.id)} style={{ backgroundColor: '#d32f2f' }}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Workouts;
