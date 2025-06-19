export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'owner' | 'manager' | 'staff' | 'client'
  businessId?: string
  avatar?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Business {
  id: string
  name: string
  description?: string
  logo?: string
  website?: string
  phone: string
  email: string
  address: Address
  settings: BusinessSettings
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface BusinessSettings {
  timezone: string
  currency: string
  bookingWindow: number // days in advance
  cancellationPolicy: string
  noShowPolicy: string
  requireDeposit: boolean
  depositAmount?: number
  allowOnlineBooking: boolean
  autoConfirmBookings: boolean
  sendReminders: boolean
  reminderTimes: number[] // hours before appointment
}

export interface Location {
  id: string
  businessId: string
  name: string
  address: Address
  phone?: string
  email?: string
  hours: BusinessHours[]
  capacity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BusinessHours {
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  openTime: string // HH:mm format
  closeTime: string // HH:mm format
  isOpen: boolean
}

export interface Service {
  id: string
  businessId: string
  name: string
  description?: string
  category: string
  duration: number // minutes
  price: number
  deposit?: number
  color: string
  isActive: boolean
  staffIds: string[]
  resources?: string[]
  createdAt: string
  updatedAt: string
}

export interface Staff {
  id: string
  businessId: string
  userId: string
  user: User
  title: string
  bio?: string
  avatar?: string
  skills: string[]
  serviceIds: string[]
  commissionRate: number
  hourlyRate?: number
  availability: StaffAvailability[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StaffAvailability {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface Client {
  id: string
  businessId: string
  userId?: string
  user?: User
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  notes?: string
  preferences: ClientPreferences
  loyaltyPoints: number
  totalSpent: number
  lastVisit?: string
  createdAt: string
  updatedAt: string
}

export interface ClientPreferences {
  preferredStaff?: string[]
  preferredServices?: string[]
  allergies?: string[]
  notes?: string
  communicationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

export interface Appointment {
  id: string
  businessId: string
  locationId: string
  clientId: string
  client: Client
  staffId: string
  staff: Staff
  serviceId: string
  service: Service
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes?: string
  internalNotes?: string
  price: number
  deposit?: number
  paymentStatus: PaymentStatus
  remindersSent: string[]
  createdAt: string
  updatedAt: string
}

export type AppointmentStatus = 
  | 'scheduled' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show'

export type PaymentStatus = 
  | 'pending' 
  | 'partial' 
  | 'paid' 
  | 'refunded' 
  | 'failed'

export interface Payment {
  id: string
  appointmentId: string
  amount: number
  tip?: number
  method: PaymentMethod
  status: PaymentStatus
  stripePaymentIntentId?: string
  refundId?: string
  createdAt: string
  updatedAt: string
}

export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'gift_card' 
  | 'loyalty_points'

export interface AvailabilitySlot {
  startTime: string
  endTime: string
  staffId: string
  staff: Staff
  isAvailable: boolean
  reason?: string
}

export interface BookingRequest {
  serviceId: string
  staffId?: string
  date: string
  time: string
  clientInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    notes?: string
  }
}

export interface SchedulingOptions {
  allowStaffSelection: boolean
  allowTimeSelection: boolean
  bufferTime: number // minutes
  maxAdvanceBooking: number // days
  minAdvanceBooking: number // hours
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  types: {
    bookingConfirmation: boolean
    reminders: boolean
    cancellations: boolean
    promotions: boolean
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
