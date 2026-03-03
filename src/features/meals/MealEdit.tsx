import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Meal, Ingredient } from '../../domain/types';
import { load, save, STORAGE_KEYS } from '../../storage/storage';
import { v4 as uuidv4 } from '../../storage/uuid';

function MealEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === undefined;

  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [prepTimeMins, setPrepTimeMins] = useState('');
  const [cookTimeMins, setCookTimeMins] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<string[]>(['']);

  useEffect(() => {
    if (!isNew && id) {
      const meals = load<Meal[]>(STORAGE_KEYS.MEALS, []);
      const meal = meals.find(m => m.id === id);
      if (meal) {
        setName(meal.name);
        setTags(meal.tags?.join(', ') || '');
        setPrepTimeMins(meal.prepTimeMins?.toString() || '');
        setCookTimeMins(meal.cookTimeMins?.toString() || '');
        setIngredients(meal.ingredients);
        setInstructions(meal.instructions.length > 0 ? meal.instructions : ['']);
      }
    }
  }, [id, isNew]);

  const addIngredient = () => {
    setIngredients([...ingredients, { id: uuidv4(), name: '', quantity: '', store: 'Coles' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const meal: Meal = {
      id: id || uuidv4(),
      name,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      ingredients: ingredients.filter(i => i.name.trim().length > 0),
      instructions: instructions.filter(i => i.trim().length > 0),
      prepTimeMins: prepTimeMins ? parseInt(prepTimeMins) : undefined,
      cookTimeMins: cookTimeMins ? parseInt(cookTimeMins) : undefined,
    };

    const meals = load<Meal[]>(STORAGE_KEYS.MEALS, []);
    if (isNew) {
      meals.push(meal);
    } else {
      const index = meals.findIndex(m => m.id === id);
      if (index !== -1) {
        meals[index] = meal;
      }
    }
    save(STORAGE_KEYS.MEALS, meals);
    navigate('/meals');
  };

  return (
    <div>
      <div className="page-header">
        <h2>{isNew ? 'Add New Meal' : 'Edit Meal'}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="form-group">
            <label>Meal Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Joe's Keto Pizza"
            />
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., keto, pizza, fathead"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Prep Time (minutes)</label>
              <input
                type="number"
                value={prepTimeMins}
                onChange={(e) => setPrepTimeMins(e.target.value)}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Cook Time (minutes)</label>
              <input
                type="number"
                value={cookTimeMins}
                onChange={(e) => setCookTimeMins(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Ingredients</h3>
          {ingredients.map((ingredient, index) => (
            <div key={ingredient.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #333', borderRadius: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Name</label>
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder="Ingredient name"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Quantity</label>
                  <input
                    type="text"
                    value={ingredient.quantity || ''}
                    onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    placeholder="e.g., 200g"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Store</label>
                  <input
                    type="text"
                    value={ingredient.store || ''}
                    onChange={(e) => updateIngredient(index, 'store', e.target.value)}
                    placeholder="Coles"
                  />
                </div>
                <button type="button" onClick={() => removeIngredient(index)} style={{ backgroundColor: '#d32f2f' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addIngredient}>
            Add Ingredient
          </button>
        </div>

        <div className="card">
          <h3>Instructions</h3>
          {instructions.map((instruction, index) => (
            <div key={index} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
              <span style={{ marginTop: '0.6em', fontWeight: 'bold' }}>{index + 1}.</span>
              <textarea
                value={instruction}
                onChange={(e) => updateInstruction(index, e.target.value)}
                placeholder="Instruction step"
                rows={2}
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => removeInstruction(index)} style={{ backgroundColor: '#d32f2f' }}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addInstruction}>
            Add Instruction
          </button>
        </div>

        <div className="button-group">
          <button type="submit">Save Meal</button>
          <button type="button" onClick={() => navigate('/meals')} style={{ backgroundColor: '#666' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default MealEdit;
