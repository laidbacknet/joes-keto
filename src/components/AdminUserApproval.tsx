import { useState } from 'react'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  email: string | null
  display_name: string | null
  role: string
  approved: boolean
  approved_at: string | null
  created_at: string
}

interface Props {
  user: UserProfile
  adminId: string
  onUpdate: (id: string, updates: Partial<UserProfile>) => void
}

export default function AdminUserApproval({ user, adminId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runUpdate = async (
    dbUpdates: Record<string, unknown>,
    stateUpdates: Partial<UserProfile>,
  ) => {
    setLoading(true)
    setError(null)
    const { error: err } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id)
    if (err) {
      setError(err.message)
    } else {
      onUpdate(user.id, stateUpdates)
    }
    setLoading(false)
  }

  const approve = () => {
    const now = new Date().toISOString()
    return runUpdate(
      { approved: true, approved_at: now, approved_by: adminId },
      { approved: true, approved_at: now },
    )
  }

  const suspend = () =>
    runUpdate(
      { approved: false, approved_at: null, approved_by: null },
      { approved: false, approved_at: null },
    )

  const promoteToAdmin = () =>
    runUpdate(
      { role: 'admin', approved: true },
      { role: 'admin', approved: true },
    )

  return (
    <div className="approval-actions">
      {error && <span className="approval-error">{error}</span>}
      {!user.approved && (
        <button
          className="admin-btn admin-btn-approve"
          onClick={approve}
          disabled={loading}
        >
          Approve
        </button>
      )}
      {user.approved && user.role !== 'admin' && (
        <button
          className="admin-btn admin-btn-suspend"
          onClick={suspend}
          disabled={loading}
        >
          Suspend
        </button>
      )}
      {user.role !== 'admin' && (
        <button
          className="admin-btn admin-btn-promote"
          onClick={promoteToAdmin}
          disabled={loading}
        >
          Make Admin
        </button>
      )}
    </div>
  )
}
