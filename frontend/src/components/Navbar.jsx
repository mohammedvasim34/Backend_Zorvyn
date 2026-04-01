import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  Users,
  LogOut,
  TrendingUp,
} from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <TrendingUp size={20} />
          </div>
          <span className="brand-text">Zorvyn</span>
          <span className="brand-sub">Finance</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            id="nav-dashboard"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
            id="nav-records"
          >
            <Receipt size={18} />
            <span>Records</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              id="nav-users"
            >
              <Users size={18} />
              <span>Users</span>
            </NavLink>
          )}
        </div>

        <div className="navbar-right">
          <div className="user-pill">
            <div className="user-avatar">
              {user?.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          <button
            className="btn btn-icon btn-secondary logout-btn"
            onClick={handleLogout}
            title="Logout"
            id="logout-btn"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  )
}
