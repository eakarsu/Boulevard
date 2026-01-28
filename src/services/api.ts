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
      const authStorage = localStorage.getItem('auth-storage')
      if (authStorage) {
        try {
          const authData = JSON.parse(authStorage)
          const refreshToken = authData.state?.refreshToken

          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken
            })

            authData.state.token = response.data.token
            localStorage.setItem('auth-storage', JSON.stringify(authData))

            error.config.headers.Authorization = `Bearer ${response.data.token}`
            return api.request(error.config)
          }
        } catch (refreshError) {
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

  deleteClient: (id: string) =>
    api.delete(`/clients/${id}`),
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

  deleteService: (id: string) =>
    api.delete(`/services/${id}`),
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

  deleteStaff: (id: string) =>
    api.delete(`/staff/${id}`),
}

// Appointments API
export const appointmentsAPI = {
  getAppointments: (params?: any) =>
    api.get('/appointments', { params }),

  getAppointment: (id: string) =>
    api.get(`/appointments/${id}`),

  createAppointment: (data: any) =>
    api.post('/appointments', data),

  updateAppointment: (id: string, data: any) =>
    api.put(`/appointments/${id}`, data),

  deleteAppointment: (id: string) =>
    api.delete(`/appointments/${id}`),
}

// Business API
export const businessAPI = {
  getSettings: () =>
    api.get('/business/settings'),

  updateSettings: (data: any) =>
    api.put('/business/settings', data),
}

// =====================================================
// NEW FEATURE APIs
// =====================================================

// Scheduling API
export const schedulingAPI = {
  getStaffAvailability: (staffId: string, date: string) =>
    api.get(`/scheduling/staff/${staffId}/availability/${date}`),

  getAvailableSlots: (staffId: string, date: string, duration: number) =>
    api.get(`/scheduling/staff/${staffId}/slots`, { params: { date, duration } }),

  checkConflict: (staffId: string, startTime: string, endTime: string, excludeAppointmentId?: string) =>
    api.post('/scheduling/check-conflict', { staffId, startTime, endTime, excludeAppointmentId }),

  setStaffAvailability: (staffId: string, availability: any[]) =>
    api.put(`/scheduling/staff/${staffId}/availability`, { availability }),

  addStaffBreak: (staffId: string, data: any) =>
    api.post(`/scheduling/staff/${staffId}/breaks`, data),

  requestTimeOff: (staffId: string, data: any) =>
    api.post(`/scheduling/staff/${staffId}/time-off`, data),

  getStaffSchedule: (staffId: string, startDate: string, endDate: string) =>
    api.get(`/scheduling/staff/${staffId}/schedule`, { params: { startDate, endDate } }),
}

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (amount: number, currency?: string) =>
    api.post('/payments/create-intent', { amount, currency }),

  processPayment: (appointmentId: string, amount: number, tip?: number, method?: string) =>
    api.post('/payments/process', { appointmentId, amount, tip, method }),

  processDeposit: (appointmentId: string, amount: number) =>
    api.post('/payments/deposit', { appointmentId, amount }),

  refundPayment: (paymentId: string, amount?: number, reason?: string) =>
    api.post(`/payments/${paymentId}/refund`, { amount, reason }),

  getPaymentHistory: (params?: any) =>
    api.get('/payments/history', { params }),

  getPaymentStats: (period?: string) =>
    api.get('/payments/stats', { params: { period } }),
}

// Notifications API
export const notificationsAPI = {
  sendTestSMS: (phone: string, message: string) =>
    api.post('/notifications/test-sms', { phone, message }),

  sendTestEmail: (email: string, subject: string, body: string) =>
    api.post('/notifications/test-email', { email, subject, body }),

  sendConfirmation: (appointmentId: string) =>
    api.post(`/notifications/send-confirmation/${appointmentId}`),

  sendReminder: (appointmentId: string, type?: string) =>
    api.post(`/notifications/send-reminder/${appointmentId}`, { type }),

  getNotificationLog: (params?: any) =>
    api.get('/notifications/log', { params }),

  getTemplates: () =>
    api.get('/notifications/templates'),

  saveTemplate: (data: any) =>
    api.post('/notifications/templates', data),

  deleteTemplate: (templateId: string) =>
    api.delete(`/notifications/templates/${templateId}`),
}

// Recurring Appointments API
export const recurringAPI = {
  createSeries: (data: any) =>
    api.post('/recurring/series', data),

  getSeries: (seriesId: string) =>
    api.get(`/recurring/series/${seriesId}`),

  getAllSeries: (params?: any) =>
    api.get('/recurring/series', { params }),

  updateSeries: (seriesId: string, data: any) =>
    api.put(`/recurring/series/${seriesId}`, data),

  cancelSeries: (seriesId: string, cancelFutureAppointments?: boolean) =>
    api.post(`/recurring/series/${seriesId}/cancel`, { cancelFutureAppointments }),

  getSeriesAppointments: (seriesId: string, upcoming?: boolean) =>
    api.get(`/recurring/series/${seriesId}/appointments`, { params: { upcoming } }),

  generateAppointments: (seriesId: string, count?: number) =>
    api.post(`/recurring/series/${seriesId}/generate`, { count }),

  getClientRecurringSeries: (clientId: string) =>
    api.get(`/recurring/client/${clientId}`),
}

// Calendar Sync API
export const calendarSyncAPI = {
  connectGoogleCalendar: (staffId: string, authCode: string) =>
    api.post(`/calendar-sync/staff/${staffId}/connect`, { authCode }),

  disconnectGoogleCalendar: (staffId: string) =>
    api.post(`/calendar-sync/staff/${staffId}/disconnect`),

  getSyncStatus: (staffId: string) =>
    api.get(`/calendar-sync/staff/${staffId}/status`),

  syncExternalEvents: (staffId: string) =>
    api.post(`/calendar-sync/staff/${staffId}/sync`),

  syncAppointmentToCalendar: (appointmentId: string) =>
    api.post(`/calendar-sync/appointments/${appointmentId}/sync`),

  getExternalEvents: (staffId: string, params?: any) =>
    api.get(`/calendar-sync/staff/${staffId}/external-events`, { params }),

  getOAuthUrl: () =>
    api.get('/calendar-sync/oauth-url'),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: (period?: string) =>
    api.get('/analytics/dashboard', { params: { period } }),

  getRevenue: (startDate: string, endDate: string, groupBy?: string) =>
    api.get('/analytics/revenue', { params: { startDate, endDate, groupBy } }),

  getStaffPerformance: (startDate?: string, endDate?: string) =>
    api.get('/analytics/staff-performance', { params: { startDate, endDate } }),

  getServicePerformance: (startDate?: string, endDate?: string) =>
    api.get('/analytics/service-performance', { params: { startDate, endDate } }),

  getClientInsights: () =>
    api.get('/analytics/client-insights'),

  getAppointmentTrends: (startDate?: string, endDate?: string) =>
    api.get('/analytics/appointment-trends', { params: { startDate, endDate } }),

  getHistorical: (startDate: string, endDate: string) =>
    api.get('/analytics/historical', { params: { startDate, endDate } }),

  exportReport: (type: string, startDate: string, endDate: string, format?: string) =>
    api.get('/analytics/export', { params: { type, startDate, endDate, format } }),
}

// Service Catalog API
export const serviceCatalogAPI = {
  // Categories
  getCategories: () =>
    api.get('/service-catalog/categories'),

  createCategory: (data: any) =>
    api.post('/service-catalog/categories', data),

  updateCategory: (categoryId: string, data: any) =>
    api.put(`/service-catalog/categories/${categoryId}`, data),

  deleteCategory: (categoryId: string) =>
    api.delete(`/service-catalog/categories/${categoryId}`),

  // Services
  getCatalogServices: (params?: any) =>
    api.get('/service-catalog', { params }),

  getServiceDetails: (serviceId: string) =>
    api.get(`/service-catalog/${serviceId}`),

  createCatalogService: (data: any) =>
    api.post('/service-catalog', data),

  updateCatalogService: (serviceId: string, data: any) =>
    api.put(`/service-catalog/${serviceId}`, data),

  deleteCatalogService: (serviceId: string) =>
    api.delete(`/service-catalog/${serviceId}`),

  // Add-ons
  getServiceAddons: (serviceId: string) =>
    api.get(`/service-catalog/${serviceId}/addons`),

  createAddon: (serviceId: string, data: any) =>
    api.post(`/service-catalog/${serviceId}/addons`, data),

  updateAddon: (addonId: string, data: any) =>
    api.put(`/service-catalog/addons/${addonId}`, data),

  deleteAddon: (addonId: string) =>
    api.delete(`/service-catalog/addons/${addonId}`),

  // Staff assignments
  assignStaffToService: (serviceId: string, staffId: string, data?: any) =>
    api.post(`/service-catalog/${serviceId}/staff`, { staffId, ...data }),

  removeStaffFromService: (serviceId: string, staffId: string) =>
    api.delete(`/service-catalog/${serviceId}/staff/${staffId}`),
}

export default api
