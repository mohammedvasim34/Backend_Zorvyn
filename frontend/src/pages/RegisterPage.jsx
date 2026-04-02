import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiErrorMessage } from '../api/client'
import { UserPlus, Mail, Lock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import './AuthPages.css'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register(email, password)
      toast.success('Account created successfully!')
      navigate('/')
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Registration failed')
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
              Join thousands of users managing their finances smarter. Get started in seconds.
            </p>
            <div className="auth-brand__features">
              <div className="feature-item">
                <span className="feature-dot" style={{ background: 'var(--color-income)' }} />
                Free dashboard analytics
              </div>
              <div className="feature-item">
                <span className="feature-dot" style={{ background: 'var(--accent-primary)' }} />
                Secure JWT authentication
              </div>
              <div className="feature-item">
                <span className="feature-dot" style={{ background: 'var(--accent-secondary)' }} />
                First user gets admin access
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h2>Create account</h2>
              <p>Start tracking your finances today</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form" id="register-form">
              <div className="input-group">
                <label htmlFor="register-email">Email address</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="register-email"
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
                <label htmlFor="register-password">Password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="register-password"
                    className="input-field"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="register-confirm-password">Confirm password</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="register-confirm-password"
                    className="input-field"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={loading}
                id="register-submit"
              >
                {loading ? (
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
