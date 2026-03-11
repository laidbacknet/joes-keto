import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import AdminUserList from '../components/AdminUserList'
import './admin.css'

type Tab = 'users' | 'meal_plans' | 'recipes'

interface MealPlanRow {
  id: string
  name: string
  plan_date: string | null
  created_at: string
  profiles: { email: string | null; display_name: string | null } | null
}

interface RecipeRow {
  id: string
  name: string
  calories: number | null
  created_at: string
  profiles: { email: string | null; display_name: string | null } | null
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('users')

  const [mealPlans, setMealPlans] = useState<MealPlanRow[]>([])
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  const [userCount, setUserCount] = useState<number | null>(null)
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: total }, { count: pending }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('approved', false),
      ])
      setUserCount(total)
      setPendingCount(pending)
    }
    fetchCounts()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true)
      if (tab === 'meal_plans') {
        const { data } = await supabase
          .from('meal_plans')
          .select('id, name, plan_date, created_at, profiles(email, display_name)')
          .order('created_at', { ascending: false })
        setMealPlans((data as unknown as MealPlanRow[]) ?? [])
        setDataLoading(false)
      } else if (tab === 'recipes') {
        const { data } = await supabase
          .from('recipes')
          .select('id, name, calories, created_at, profiles(email, display_name)')
          .order('created_at', { ascending: false })
        setRecipes((data as unknown as RecipeRow[]) ?? [])
        setDataLoading(false)
      } else {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [tab])

  const deleteMealPlan = async (id: string) => {
    if (!confirm('Delete this meal plan?')) return
    const { error } = await supabase.from('meal_plans').delete().eq('id', id)
    if (!error) setMealPlans(prev => prev.filter(p => p.id !== id))
  }

  const deleteRecipe = async (id: string) => {
    if (!confirm('Delete this recipe?')) return
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (!error) setRecipes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage users, meal plans, and recipes across the application.</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="stat-number">{userCount ?? '…'}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-number">{pendingCount ?? '…'}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab${tab === 'users' ? ' active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
          {pendingCount !== null && pendingCount > 0 && (
            <span className="admin-badge" style={{ marginLeft: '0.4rem' }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button
          className={`admin-tab${tab === 'meal_plans' ? ' active' : ''}`}
          onClick={() => setTab('meal_plans')}
        >
          Meal Plans
        </button>
        <button
          className={`admin-tab${tab === 'recipes' ? ' active' : ''}`}
          onClick={() => setTab('recipes')}
        >
          Recipes
        </button>
      </div>

      {tab === 'users' && <AdminUserList />}

      {tab === 'meal_plans' && (
        <div>
          <div className="admin-section-header">
            <h2>All Meal Plans</h2>
          </div>
          {dataLoading ? (
            <p className="admin-loading">Loading…</p>
          ) : mealPlans.length === 0 ? (
            <p className="admin-empty">No meal plans found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Plan Date</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mealPlans.map(p => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>
                        {p.profiles?.display_name ?? p.profiles?.email ?? '—'}
                      </td>
                      <td>{p.plan_date ?? '—'}</td>
                      <td>{new Date(p.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={() => deleteMealPlan(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'recipes' && (
        <div>
          <div className="admin-section-header">
            <h2>All Recipes</h2>
          </div>
          {dataLoading ? (
            <p className="admin-loading">Loading…</p>
          ) : recipes.length === 0 ? (
            <p className="admin-empty">No recipes found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Calories</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map(r => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>
                        {r.profiles?.display_name ?? r.profiles?.email ?? '—'}
                      </td>
                      <td>{r.calories ?? '—'}</td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={() => deleteRecipe(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
