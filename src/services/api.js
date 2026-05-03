import axios from 'axios'

const getAPIBaseURL = () => {
  if (import.meta?.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '')
  }
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000'
  }
  return window.location.origin
}

const API_BASE_URL = getAPIBaseURL()
const API_URL = `${API_BASE_URL}/api`

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('professionalToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  getMe:    ()     => api.get('/auth/me')
}

export const usersAPI = {
  getAll:  ()         => api.get('/users'),
  getById: (id)       => api.get(`/users/${id}`),
  create:  (data)     => api.post('/auth/register', data),
  update:  (id, data) => api.put(`/users/${id}`, data),
  delete:  (id)       => api.delete(`/users/${id}`)
}

export default api
