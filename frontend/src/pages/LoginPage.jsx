import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Mail, Lock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPages.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container slide-up">
        {/* Left branding panel */}
        <div className="auth-brand">
          <div className="auth-brand__inner">
            <div className="brand-icon-lg">
              <TrendingUp size={32} />
            </div>
            <h1>Zorvyn Finance</h1>
            <p>
              Take control of your finances. Track income, expenses, and gain powerful insights from your financial data.
            </p>
            <div className="auth-brand__features">
              <div className="feature-item">
                <span className="feature-dot" style={{ background: 'var(--color-income)' }} />
                Real-time dashboard analytics
              </div>
              <div className="feature-item">
                <span className="feature-dot" style={{ background: 'var(--accent-primary)' }} />
                Category-wise breakdown
              </div>
              <div className="feature-item">
                <span className="feature-dot" style={{ background: 'var(--accent-secondary)' }} />
                Role-based access control
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" id="login-form">
              <div className="input-group">
                <label htmlFor="login-email">Email address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="login-email"
                    className="input-field"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="login-password"
                    className="input-field"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
                id="login-submit"
              >
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
