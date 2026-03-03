import { useEffect, useState } from 'react';
import type { Meal, PlannedMeal, ShoppingItem, Ingredient } from '../../domain/types';
import { load, save, STORAGE_KEYS } from '../../storage/storage';
import { v4 as uuidv4 } from '../../storage/uuid';

function Shopping() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [manualItems, setManualItems] = useState<ShoppingItem[]>([]);

  useEffect(() => {
    // Default to current week
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    setStartDate(startOfWeek.toISOString().split('T')[0]);
    setEndDate(endOfWeek.toISOString().split('T')[0]);
    
    loadManualItems();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      generateShoppingList();
    }
  }, [startDate, endDate]);

  const loadManualItems = () => {
    const items = load<ShoppingItem[]>(STORAGE_KEYS.SHOPPING_MANUAL_ITEMS, []);
    setManualItems(items);
  };

  const generateShoppingList = () => {
    const meals = load<Meal[]>(STORAGE_KEYS.MEALS, []);
    const plannedMeals = load<PlannedMeal[]>(STORAGE_KEYS.PLANNED_MEALS, []);
    
    // Filter planned meals in date range
    const mealsInRange = plannedMeals.filter(pm => {
      return pm.date >= startDate && pm.date <= endDate;
    });
    
    // Aggregate ingredients
    const ingredientMap = new Map<string, { quantity: string[]; store: string; ingredient: Ingredient }>();
    
    mealsInRange.forEach(pm => {
      const meal = meals.find(m => m.id === pm.mealId);
      if (meal) {
        meal.ingredients.forEach(ing => {
          const key = ing.name.toLowerCase().trim();
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            if (ing.quantity) {
              existing.quantity.push(ing.quantity);
            }
          } else {
            ingredientMap.set(key, {
              quantity: ing.quantity ? [ing.quantity] : [],
              store: ing.store || 'Coles',
              ingredient: ing,
            });
          }
        });
      }
    });
    
    // Convert to shopping items
    const items: ShoppingItem[] = Array.from(ingredientMap.values()).map(item => ({
      id: uuidv4(),
      name: item.ingredient.name,
      quantity: item.quantity.join(' + '),
      store: item.store,
      checked: false,
      manual: false,
    }));
    
    setShoppingItems(items);
  };

  const addManualItem = () => {
    const name = prompt('Enter item name:');
    if (!name) return;
    
    const newItem: ShoppingItem = {
      id: uuidv4(),
      name,
      quantity: '',
      store: 'Coles',
      checked: false,
      manual: true,
    };
    
    const updated = [...manualItems, newItem];
    setManualItems(updated);
    save(STORAGE_KEYS.SHOPPING_MANUAL_ITEMS, updated);
  };

  const removeManualItem = (id: string) => {
    const updated = manualItems.filter(item => item.id !== id);
    setManualItems(updated);
    save(STORAGE_KEYS.SHOPPING_MANUAL_ITEMS, updated);
  };

  const toggleItemChecked = (id: string, isManual: boolean) => {
    if (isManual) {
      const updated = manualItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      setManualItems(updated);
      save(STORAGE_KEYS.SHOPPING_MANUAL_ITEMS, updated);
    } else {
      const updated = shoppingItems.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      setShoppingItems(updated);
    }
  };

  const allItems = [...shoppingItems, ...manualItems].sort((a, b) => {
    if (a.checked !== b.checked) {
      return a.checked ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  const groupedByStore = allItems.reduce((acc, item) => {
    const store = item.store || 'Coles';
    if (!acc[store]) {
      acc[store] = [];
    }
    acc[store].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div>
      <div className="page-header">
        <h2>Shopping List</h2>
        <button onClick={addManualItem}>+ Add Manual Item</button>
      </div>

      <div className="card">
        <h3>Date Range</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button onClick={generateShoppingList}>Refresh List</button>
        </div>
      </div>

      {Object.entries(groupedByStore).map(([store, items]) => (
        <div key={store} className="card">
          <h3>{store}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {items.map(item => (
              <li
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  border: '1px solid #333',
                  textDecoration: item.checked ? 'line-through' : 'none',
                  opacity: item.checked ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.checked || false}
                  onChange={() => toggleItemChecked(item.id, item.manual || false)}
                  style={{ marginRight: '1rem', width: 'auto', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{item.name}</strong>
                  {item.quantity && <span style={{ marginLeft: '0.5rem', color: '#888' }}>({item.quantity})</span>}
                  {item.manual && <span style={{ marginLeft: '0.5rem', fontSize: '0.85em', color: '#646cff' }}>[Manual]</span>}
                </div>
                {item.manual && (
                  <button
                    onClick={() => removeManualItem(item.id)}
                    style={{ fontSize: '0.8em', padding: '0.25rem 0.5rem', backgroundColor: '#d32f2f' }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {allItems.length === 0 && (
        <div className="card">
          <p>No items in shopping list. Select a date range and add meals to your plan to generate a shopping list.</p>
        </div>
      )}
    </div>
  );
}

export default Shopping;
