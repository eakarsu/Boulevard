import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

console.log('API Base URL:', API_BASE_URL)

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  console.log('Making API request to:', config.url)
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const authData = JSON.parse(token)
      if (authData.state?.token) {
        config.headers.Authorization = `Bearer ${authData.state.token}`
        console.log('Added auth token to request')
      }
    } catch (error) {
      console.error('Error parsing auth token:', error)
    }
  } else {
    console.log('No auth token found')
  }
  return config
})

// Handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.config.url)
    return response
  },
  async (error) => {
    console.error('API request failed:', error.message, error.config?.url)
    if (error.response) {
      console.error('Response status:', error.response.status)
      console.error('Response data:', error.response.data)
    }
    
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          const refreshToken = authData.state?.refreshToken
          
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken
            })
            
            // Update token in storage
            authData.state.token = response.data.token
            localStorage.setItem('auth-storage', JSON.stringify(authData))
            
            // Retry original request
            error.config.headers.Authorization = `Bearer ${response.data.token}`
            return api.request(error.config)
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('auth-storage')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
}

// Clients API
export const clientsAPI = {
  getClients: (params?: any) =>
    api.get('/clients', { params }),
  
  getClientStats: () =>
    api.get('/clients/stats'),
  
  createClient: (data: any) =>
    api.post('/clients', data),
  
  updateClient: (id: string, data: any) =>
    api.put(`/clients/${id}`, data),
}

// Services API
export const servicesAPI = {
  getServices: (params?: any) =>
    api.get('/services', { params }),
  
  getServiceStats: () =>
    api.get('/services/stats'),
  
  createService: (data: any) =>
    api.post('/services', data),
  
  updateService: (id: string, data: any) =>
    api.put(`/services/${id}`, data),
}

// Staff API
export const staffAPI = {
  getStaff: (params?: any) =>
    api.get('/staff', { params }),
  
  getStaffStats: () =>
    api.get('/staff/stats'),
  
  createStaff: (data: any) =>
    api.post('/staff', data),
  
  updateStaff: (id: string, data: any) =>
    api.put(`/staff/${id}`, data),
}

// Appointments API
export const appointmentsAPI = {
  getAppointments: (params?: any) =>
    api.get('/appointments', { params }),
  
  createAppointment: (data: any) =>
    api.post('/appointments', data),
  
  updateAppointment: (id: string, data: any) =>
    api.put(`/appointments/${id}`, data),
}

// Business API
export const businessAPI = {
  getSettings: () =>
    api.get('/business/settings'),
  
  updateSettings: (data: any) =>
    api.put('/business/settings', data),
}

export default api
