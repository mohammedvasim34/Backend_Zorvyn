import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, check if token exists and fetch user
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authAPI
        .me()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (identifier, password) => {
    const res = await authAPI.login(identifier, password)
    const token = res.data.access_token
    localStorage.setItem('access_token', token)
    const meRes = await authAPI.me()
    setUser(meRes.data)
    return meRes.data
  }

  const register = async (email, password) => {
    await authAPI.register(email, password)
    // Auto-login after registration
    return login(email, password)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const isAdmin = user?.role === 'admin'
  const isAnalyst = user?.role === 'analyst' || isAdmin

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAdmin, isAnalyst }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
