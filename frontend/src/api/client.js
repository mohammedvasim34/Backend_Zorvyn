import axios from 'axios'

const API_BASE_URL = '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — redirect to login
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      // Only redirect if not already on login/register page
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ---- Auth ----
export const authAPI = {
  register: (email, password, name = null) =>
    client.post('/auth/register', { name, email, password }),
  login: (identifier, password) => {
    const params = new URLSearchParams()
    params.append('username', identifier)
    params.append('password', password)
    return client.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => client.get('/auth/me'),
}

// ---- Records ----
export const recordsAPI = {
  list: (params = {}) => client.get('/records', { params }),
  create: (data) => client.post('/records', data),
  update: (id, data) => client.put(`/records/${id}`, data),
  delete: (id) => client.delete(`/records/${id}`),
}

// ---- Dashboard ----
export const dashboardAPI = {
  summary: (recentLimit = 5) =>
    client.get('/dashboard/summary', { params: { recent_limit: recentLimit } }),
  trends: () => client.get('/dashboard/trends'),
  categoryBreakdown: () => client.get('/dashboard/category-breakdown'),
  topCategories: () => client.get('/dashboard/top-categories'),
  recent: () => client.get('/dashboard/recent'),
  insights: () => client.get('/dashboard/insights'),
}

// ---- Users ----
export const usersAPI = {
  list: (skip = 0, limit = 50) =>
    client.get('/users', { params: { skip, limit } }),
  get: (id) => client.get(`/users/${id}`),
  updateRole: (id, role) =>
    client.patch(`/users/${id}/role`, { role }),
  updateStatus: (id, isActive) =>
    client.patch(`/users/${id}/status`, { is_active: isActive }),
}

export default client

export function getApiErrorMessage(error, fallback = 'Request failed') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    if (typeof first === 'string') return first
    if (first?.msg) return first.msg
  }
  if (error?.message === 'Network Error') {
    return 'Cannot reach API server. Ensure backend is running on :8000 and frontend is using the correct API URL/proxy (CORS or origin mismatch can also cause this).'
  }
  return fallback
}
