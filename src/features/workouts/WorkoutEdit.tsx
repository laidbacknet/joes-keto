import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Workout, Exercise } from '../../domain/types';
import { load, save, STORAGE_KEYS } from '../../storage/storage';
import { v4 as uuidv4 } from '../../storage/uuid';

function WorkoutEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === undefined;

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      const workouts = load<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
      const workout = workouts.find(w => w.id === id);
      if (workout) {
        setName(workout.name);
        setExercises(workout.exercises);
      }
    }
  }, [id, isNew]);

  const addExercise = () => {
    setExercises([...exercises, { id: uuidv4(), name: '', sets: 3, reps: '10', load: '', notes: '' }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const workout: Workout = {
      id: id || uuidv4(),
      name,
      exercises: exercises.filter(e => e.name.trim().length > 0),
    };

    const workouts = load<Workout[]>(STORAGE_KEYS.WORKOUTS, []);
    if (isNew) {
      workouts.push(workout);
    } else {
      const index = workouts.findIndex(w => w.id === id);
      if (index !== -1) {
        workouts[index] = workout;
      }
    }
    save(STORAGE_KEYS.WORKOUTS, workouts);
    navigate('/workouts');
  };

  return (
    <div>
      <div className="page-header">
        <h2>{isNew ? 'Add New Workout' : 'Edit Workout'}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Workout Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Full Body Workout A"
            />
          </div>
        </div>

        <div className="card">
          <h3>Exercises</h3>
          {exercises.map((exercise, index) => (
            <div key={exercise.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #333', borderRadius: '4px' }}>
              <div className="form-group">
                <label>Exercise Name</label>
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  placeholder="e.g., Dumbbell Bench Press"
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label>Sets</label>
                  <input
                    type="number"
                    value={exercise.sets || ''}
                    onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                    placeholder="3"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Reps</label>
                  <input
                    type="text"
                    value={exercise.reps || ''}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    placeholder="8-10"
                  />
                </div>
                <div className="form-group">
                  <label>Load</label>
                  <input
                    type="text"
                    value={exercise.load || ''}
                    onChange={(e) => updateExercise(index, 'load', e.target.value)}
                    placeholder="e.g., 15kg"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <input
                  type="text"
                  value={exercise.notes || ''}
                  onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                  placeholder="Optional notes"
                />
              </div>

              <button type="button" onClick={() => removeExercise(index)} style={{ backgroundColor: '#d32f2f' }}>
                Remove Exercise
              </button>
            </div>
          ))}
          <button type="button" onClick={addExercise}>
            Add Exercise
          </button>
        </div>

        <div className="button-group">
          <button type="submit">Save Workout</button>
          <button type="button" onClick={() => navigate('/workouts')} style={{ backgroundColor: '#666' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkoutEdit;
