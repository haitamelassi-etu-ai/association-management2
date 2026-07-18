import axios from 'axios'
import { API_BASE_URL, API_URL, getAuthToken } from '../utils/api'

console.log('🔧 API Configuration:', { 
  hostname: window.location.hostname, 
  origin: window.location.origin,
  API_BASE_URL,
  API_URL
})

// Socket.io URL export for chat
export const SOCKET_URL = API_BASE_URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  console.log('API Request:', config.url, 'Token:', config.headers.Authorization ? 'Present' : 'Missing')
  return config
})

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
}

// Beneficiaries API
export const beneficiariesAPI = {
  getAll: (params) => api.get('/beneficiaries', { params }),
  getById: (id) => api.get(`/beneficiaries/${id}`),
  create: (data) => api.post('/beneficiaries', data),
  update: (id, data) => api.put(`/beneficiaries/${id}`, data),
  delete: (id) => api.delete(`/beneficiaries/${id}`),
  addSuivi: (id, data) => api.post(`/beneficiaries/${id}/suivi`, data),
  getStats: () => api.get('/beneficiaries/stats/dashboard'),
  // Import
  importExcel: (formData) => api.post('/beneficiaries/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  downloadTemplate: () => api.get('/beneficiaries/export/template', { responseType: 'blob' }),
  // Distributions
  getDistributions: (id) => api.get(`/beneficiaries/${id}/distributions`),
  addDistribution: (id, data) => api.post(`/beneficiaries/${id}/distributions`, data),
  getAllDistributions: (params) => api.get('/beneficiaries/distributions/all', { params })
}

// Announcements API
export const announcementsAPI = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  delete: (id) => api.delete(`/announcements/${id}`)
}

// Attendance API
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (id) => api.put(`/attendance/checkout/${id}`),
  getMy: (params) => api.get('/attendance/me', { params }),
  getAll: (params) => api.get('/attendance', { params })
}

// Users API (Admin)
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/auth/register', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
}

// Associations API (Admin + current association)
export const associationsAPI = {
  getMe: () => api.get('/associations/me'),
  getAll: () => api.get('/associations'),
  create: (data) => api.post('/associations', data),
  update: (id, data) => api.put(`/associations/${id}`, data)
}

// Transport API
export const transportAPI = {
  getVehicles: (params) => api.get('/transport/vehicles', { params }),
  createVehicle: (data) => api.post('/transport/vehicles', data),
  updateVehicle: (id, data) => api.put(`/transport/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/transport/vehicles/${id}`),
  getMaintenance: (params) => api.get('/transport/maintenance', { params }),
  createMaintenance: (data) => api.post('/transport/maintenance', data),
  updateMaintenance: (id, data) => api.put(`/transport/maintenance/${id}`, data),
  deleteMaintenance: (id) => api.delete(`/transport/maintenance/${id}`),
  getIncidents: (params) => api.get('/transport/incidents', { params }),
  createIncident: (data) => api.post('/transport/incidents', data),
  updateIncident: (id, data) => api.put(`/transport/incidents/${id}`, data),
  resolveIncident: (id) => api.patch(`/transport/incidents/${id}/resolve`),
  deleteIncident: (id) => api.delete(`/transport/incidents/${id}`)
}

export default api
