import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false, allowedRoles = null }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (allowedRoles?.length) {
    const normalizedRole = String(user?.role || '')
      .toLowerCase()
      .split('.')
      .pop()
    if (!allowedRoles.includes(normalizedRole)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
