import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import Layout from './app/Layout'
import Dashboard from './features/Dashboard'
import MealsPage from './features/meals/MealsPage'
import PlanPage from './features/plan/PlanPage'
import WorkoutsPage from './features/workouts/WorkoutsPage'
import ShoppingPage from './features/shopping/ShoppingPage'
import StarterMealsPage from './features/onboarding/StarterMealsPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MagicLinkLogin from './pages/MagicLinkLogin'
import PendingApproval from './pages/PendingApproval'
import AdminDashboard from './pages/AdminDashboard'
import { AuthProvider, useAuth } from './context/AuthProvider'
import './App.css'

function ProtectedRoute() {
  const { session, loading, profile, profileLoading } = useAuth()
  const location = useLocation()

  if (loading || profileLoading) return <div className="auth-loading">Loading…</div>
  if (!session) return <Navigate to="/login" replace />

  // Block unapproved, non-admin users
  if (
    profile !== null &&
    !profile.approved &&
    profile.role !== 'admin' &&
    location.pathname !== '/pending-approval'
  ) {
    return <Navigate to="/pending-approval" replace />
  }

  // Redirect un-onboarded users (admins skip onboarding)
  if (
    profile !== null &&
    profile.role !== 'admin' &&
    !profile.has_completed_onboarding &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}

function AdminRoute() {
  const { session, loading, profile, profileLoading } = useAuth()

  if (loading || profileLoading) return <div className="auth-loading">Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  if (!profile || profile.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/magic-link" element={<MagicLinkLogin />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<StarterMealsPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="meals" element={<MealsPage />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="workouts" element={<WorkoutsPage />} />
              <Route path="shopping" element={<ShoppingPage />} />
            </Route>
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Layout />}>
              <Route index element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
