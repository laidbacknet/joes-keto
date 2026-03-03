import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Meal } from '../../domain/types';
import { load, save, STORAGE_KEYS } from '../../storage/storage';

function Meals() {
  const [meals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = () => {
    const loadedMeals = load<Meal[]>(STORAGE_KEYS.MEALS, []);
    setMeals(loadedMeals);
  };

  const deleteMeal = (id: string) => {
    if (confirm('Are you sure you want to delete this meal?')) {
      const updatedMeals = meals.filter(m => m.id !== id);
      save(STORAGE_KEYS.MEALS, updatedMeals);
      setMeals(updatedMeals);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Meals</h2>
        <Link to="/meals/new">
          <button>Add New Meal</button>
        </Link>
      </div>

      {meals.length === 0 ? (
        <p>No meals yet. Add your first meal to get started!</p>
      ) : (
        <div>
          {meals.map(meal => (
            <div key={meal.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginTop: 0 }}>{meal.name}</h3>
                  {meal.tags && meal.tags.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      {meal.tags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            marginRight: '0.5rem',
                            backgroundColor: '#333',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p style={{ color: '#888', margin: '0.5rem 0' }}>
                    {meal.ingredients.length} ingredients
                    {meal.prepTimeMins && ` • Prep: ${meal.prepTimeMins} mins`}
                    {meal.cookTimeMins && ` • Cook: ${meal.cookTimeMins} mins`}
                  </p>
                </div>
                <div className="button-group">
                  <Link to={`/meals/${meal.id}`}>
                    <button>Edit</button>
                  </Link>
                  <button onClick={() => deleteMeal(meal.id)} style={{ backgroundColor: '#d32f2f' }}>
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

export default Meals;
