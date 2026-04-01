import { useEffect, useState } from 'react'
import { usersAPI } from '../api/client'
import { Shield, ShieldCheck, ShieldAlert, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import './UsersPage.css'

const ROLE_ICONS = {
  admin: ShieldAlert,
  analyst: ShieldCheck,
  viewer: Shield,
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.list()
      setUsers(res.data)
    } catch (err) {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole)
      toast.success('Role updated')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update role')
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await usersAPI.updateStatus(userId, !currentStatus)
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
    }
  }

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="page-wrapper fade-in">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="users-grid stagger-children">
        {users.map((u) => {
          const RoleIcon = ROLE_ICONS[u.role] || Shield
          return (
            <div key={u.id} className="glass-card user-card slide-up">
              <div className="user-card__header">
                <div className="user-card__avatar">
                  {u.email.charAt(0).toUpperCase()}
                </div>
                <div className="user-card__info">
                  <div className="user-card__email">{u.email}</div>
                  <div className="user-card__id">ID: {u.id}</div>
                </div>
                <button
                  className={`btn btn-icon btn-sm ${u.is_active ? 'status-active' : 'status-inactive'}`}
                  onClick={() => handleStatusToggle(u.id, u.is_active)}
                  title={u.is_active ? 'Deactivate' : 'Activate'}
                >
                  {u.is_active ? <UserCheck size={16} /> : <UserX size={16} />}
                </button>
              </div>

              <div className="user-card__footer">
                <div className="user-card__status">
                  <span className={`badge ${u.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="user-card__role-select">
                  <RoleIcon size={14} style={{ marginRight: '6px', opacity: 0.6 }} />
                  <select
                    className="input-field role-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
