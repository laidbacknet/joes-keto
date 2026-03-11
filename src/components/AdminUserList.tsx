import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthProvider'
import AdminUserApproval, { type UserProfile } from './AdminUserApproval'

export default function AdminUserList() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, email, display_name, role, approved, approved_at, created_at')
        .order('created_at', { ascending: false })
      setUsers(data ?? [])
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const handleUpdate = (id: string, updates: Partial<UserProfile>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)))
  }

  const filtered = users.filter(u => {
    if (filter === 'pending') return !u.approved
    if (filter === 'approved') return u.approved
    return true
  })

  if (loading) return <p className="admin-loading">Loading users…</p>

  return (
    <div className="admin-user-list">
      <div className="admin-filter-bar">
        <span className="admin-filter-label">Show:</span>
        {(['all', 'pending', 'approved'] as const).map(f => (
          <button
            key={f}
            className={`admin-filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && (
              <span className="admin-badge">
                {users.filter(u => !u.approved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="admin-empty">No users found.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Display Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.email ?? '—'}</td>
                  <td>{u.display_name ?? '—'}</td>
                  <td>
                    <span className={`admin-role-badge role-${u.role}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status-badge status-${u.approved ? 'approved' : 'pending'}`}>
                      {u.approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.id !== user?.id ? (
                      <AdminUserApproval
                        user={u}
                        adminId={user?.id ?? ''}
                        onUpdate={handleUpdate}
                      />
                    ) : (
                      <span className="admin-self-label">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
