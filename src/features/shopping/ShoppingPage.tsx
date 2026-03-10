import { useEffect, useState } from "react";
import type { ShoppingItem } from "../../domain/types";
import { getPlannedMealsForDateRange } from "../planner/api";
import { getMealsForUser } from "../meals/api";
import { v4 as uuidv4 } from "../../storage/uuid";
import "./ShoppingPage.css";

export default function ShoppingPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [aggregatedItems, setAggregatedItems] = useState<ShoppingItem[]>([]);
  const [manualItems, setManualItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    // Set default to this week
    const today = new Date();
    const monday = getMonday(today);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    
    setStartDate(formatDate(monday));
    setEndDate(formatDate(sunday));
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      generateShoppingList();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const generateShoppingList = async () => {
    setListLoading(true);
    try {
      const [plannedMeals, allMeals] = await Promise.all([
        getPlannedMealsForDateRange(startDate, endDate),
        getMealsForUser(),
      ]);

      const mealMap = new Map(allMeals.map(m => [m.id, m]));
      const aggregated = new Map<string, ShoppingItem>();

      plannedMeals.forEach(pm => {
        const meal = mealMap.get(pm.mealId);
        if (meal) {
          meal.ingredients.forEach(ing => {
            const key = ing.name.toLowerCase();
            if (aggregated.has(key)) {
              const existing = aggregated.get(key)!;
              const newQuantity = existing.quantity
                ? `${existing.quantity}, ${ing.quantity || ""}`.trim()
                : ing.quantity || "";
              aggregated.set(key, {
                ...existing,
                quantity: newQuantity.endsWith(",") ? newQuantity.slice(0, -1) : newQuantity,
              });
            } else {
              aggregated.set(key, {
                id: uuidv4(),
                name: ing.name,
                quantity: ing.quantity,
                store: ing.store || "Coles",
                checked: false,
                manual: false,
              });
            }
          });
        }
      });

      setAggregatedItems(Array.from(aggregated.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  const handleAddManualItem = () => {
    if (!newItemName.trim()) return;
    const newItem: ShoppingItem = {
      id: uuidv4(),
      name: newItemName,
      store: "Coles",
      checked: false,
      manual: true,
    };
    setManualItems(prev => [...prev, newItem]);
    setNewItemName("");
  };

  const handleDeleteManualItem = (id: string) => {
    setManualItems(prev => prev.filter(i => i.id !== id));
  };

  const handleToggleCheck = (id: string) => {
    setManualItems(prev =>
      prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i)
    );
  };

  const allItems = [...aggregatedItems, ...manualItems];
  const checkedCount = manualItems.filter(i => i.checked).length;

  return (
    <div className="shopping-page">
      <h1>🛒 Shopping List</h1>

      <div className="date-selector">
        <div className="form-group">
          <label>From</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>To</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={generateShoppingList}>
          🔄 Refresh List
        </button>
      </div>

      <div className="shopping-layout">
        <div className="shopping-list">
          <div className="list-header">
            <h2>Items ({allItems.length})</h2>
            {manualItems.length > 0 && (
              <span className="checked-count">
                {checkedCount}/{manualItems.length} manual items checked
              </span>
            )}
          </div>

          {listLoading ? (
            <p className="empty-message">Loading items…</p>
          ) : allItems.length === 0 ? (
            <p className="empty-message">
              No items in shopping list. Plan some meals or add manual items.
            </p>
          ) : (
            <div className="items-grid">
              {allItems.map(item => (
                <div 
                  key={item.id} 
                  className={`shopping-item ${item.checked ? 'checked' : ''} ${item.manual ? 'manual' : 'auto'}`}
                >
                  {item.manual && (
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleCheck(item.id)}
                    />
                  )}
                  <div className="item-content">
                    <div className="item-name">{item.name}</div>
                    {item.quantity && (
                      <div className="item-quantity">{item.quantity}</div>
                    )}
                    <div className="item-store">📍 {item.store}</div>
                  </div>
                  {item.manual && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteManualItem(item.id)}
                    >
                      ✕
                    </button>
                  )}
                  {!item.manual && (
                    <span className="auto-badge">Auto</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="add-manual-section">
          <h3>Add Manual Item</h3>
          <div className="add-item-form">
            <input
              type="text"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddManualItem()}
              placeholder="Item name"
            />
            <button className="btn btn-primary" onClick={handleAddManualItem}>
              + Add
            </button>
          </div>
          <p className="help-text">
            Items from planned meals are added automatically. 
            Add extra items here manually.
          </p>
        </div>
      </div>
    </div>
  );
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
