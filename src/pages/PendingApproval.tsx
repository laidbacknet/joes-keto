import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import './auth.css'

export default function PendingApproval() {
  const { session, loading, profile, profileLoading, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading || profileLoading) return
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    if (profile?.approved || profile?.role === 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [session, loading, profile, profileLoading, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading || profileLoading) {
    return <div className="auth-loading">Loading…</div>
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🥑 Joe's Keto</h1>
        <h2>Account Pending Approval</h2>
        <p style={{ textAlign: 'center', color: '#555', marginBottom: '1.5rem' }}>
          Thanks for signing up! Your account is currently pending review by an
          admin. You'll gain access to the app once your account is approved.
        </p>
        <button className="auth-btn auth-btn-secondary" onClick={handleSignOut}>
          Log Out
        </button>
      </div>
    </div>
  )
}
