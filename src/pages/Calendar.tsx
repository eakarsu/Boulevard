import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, User, MapPin } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, endOfDay } from 'date-fns'
import { appointmentsAPI, clientsAPI, staffAPI, servicesAPI } from '../services/api'
import { AppointmentDetailModal } from '../components/modals'

interface Appointment {
  id: string
  clientName: string
  service: string
  staff: string
  startTime: string
  endTime: string
  date: Date
  status: string
  color: string
}

const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 8 // Start from 8 AM to 9 PM
  return `${hour.toString().padStart(2, '0')}:00`
})

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState<'week' | 'day'>('week')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Appointment | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])

  const weekStart = startOfWeek(currentWeek)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    fetchAppointments()
  }, [currentWeek])

  useEffect(() => {
    fetchDropdownData()
  }, [])

  const fetchDropdownData = async () => {
    try {
      const [clientsRes, staffRes, servicesRes] = await Promise.all([
        clientsAPI.getClients({ limit: 100 }),
        staffAPI.getStaff(),
        servicesAPI.getServices()
      ])
      setClients(clientsRes.data?.data?.clients || [])
      setStaffList(staffRes.data?.data || [])
      setServices(servicesRes.data?.data || [])
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const weekEnd = endOfDay(addDays(weekStart, 6))

      const response = await appointmentsAPI.getAppointments({
        start_date: weekStart.toISOString(),
        end_date: weekEnd.toISOString()
      })
      
      // Transform the data to match our component interface
      const appointmentsData = Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : [])
      
      const transformedAppointments = appointmentsData.map((apt: any) => ({
        id: apt.id,
        clientName: apt.clientName || 'Unknown Client',
        service: apt.service || 'Unknown Service',
        staff: apt.staff || 'Unknown Staff',
        startTime: apt.startTime || '00:00',
        endTime: apt.endTime || '00:00',
        date: new Date(apt.date),
        status: apt.status,
        color: apt.color || getStatusColor(apt.status)
      }))
      
      console.log('Setting appointments:', transformedAppointments.length, 'appointments')
      if (transformedAppointments.length > 0) {
        console.log('First appointment:', transformedAppointments[0])
        console.log('First appointment date:', transformedAppointments[0].date.toDateString())
        console.log('Current week dates:', weekDates.map(d => d.toDateString()))
        
        // Debug: Check if any appointments match current week
        const matchingAppointments = transformedAppointments.filter(apt => 
          weekDates.some(weekDate => apt.date.toDateString() === weekDate.toDateString())
        )
        console.log('Appointments matching current week:', matchingAppointments.length)
      }
      setAppointments(transformedAppointments)
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#3B82F6'
      case 'in_progress':
        return '#22C55E'
      case 'completed':
        return '#6B7280'
      case 'cancelled':
        return '#EF4444'
      default:
        return '#A855F7'
    }
  }

  const getAppointmentsForDate = (date: Date) => {
    const filtered = appointments.filter(apt => {
      // Ensure we're working with proper Date objects
      const aptDate = new Date(apt.date)
      const targetDate = new Date(date)
      
      // Compare just the date parts (ignore time)
      const aptDateStr = aptDate.toDateString()
      const targetDateStr = targetDate.toDateString()
      
      const matches = aptDateStr === targetDateStr
      
      if (matches) {
        console.log(`✓ Found appointment ${apt.id} for ${targetDateStr}`)
      }
      
      return matches
    })
    
    if (filtered.length > 0) {
      console.log(`Found ${filtered.length} appointments for ${date.toDateString()}`)
    }
    
    return filtered
  }

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(null)
    setEditingAppointment(appointment)
  }

  const handleDelete = async (appointment: Appointment) => {
    setSelectedAppointment(null)
    setDeleteConfirm(appointment)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await appointmentsAPI.deleteAppointment(deleteConfirm.id)
      setDeleteConfirm(null)
      fetchAppointments()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      alert('Failed to delete appointment')
    }
  }

  const handleUpdateAppointment = async (updatedData: any) => {
    if (!editingAppointment) return

    try {
      await appointmentsAPI.updateAppointment(editingAppointment.id, updatedData)
      setEditingAppointment(null)
      fetchAppointments()
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Failed to update appointment')
    }
  }

  const handleMarkComplete = async (appointment: any) => {
    try {
      await appointmentsAPI.updateAppointment(appointment.id, { status: 'completed' })
      setSelectedAppointment(null)
      fetchAppointments()
    } catch (error) {
      console.error('Error marking appointment complete:', error)
    }
  }

  const handleCancel = async (appointment: any) => {
    try {
      await appointmentsAPI.updateAppointment(appointment.id, { status: 'cancelled' })
      setSelectedAppointment(null)
      fetchAppointments()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    }
  }

  const handleCreateAppointment = async (appointmentData: any) => {
    try {
      await appointmentsAPI.createAppointment(appointmentData)
      setShowCreateModal(false)
      fetchAppointments()
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Failed to create appointment')
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Calendar</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={prevWeek}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-lg font-medium">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </span>
              <button
                onClick={nextWeek}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  view === 'week'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  view === 'day'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Day
              </button>
            </div>
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mt-8 card">
          <div className="card-body p-0">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-4 text-sm font-medium text-gray-500">Time</div>
              {weekDates.map((date, index) => (
                <div
                  key={date.toISOString()}
                  className={`p-4 text-center border-l border-gray-200 ${
                    isSameDay(date, new Date()) ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {weekDays[index]}
                  </div>
                  <div className={`text-lg ${
                    isSameDay(date, new Date()) ? 'text-primary-600 font-semibold' : 'text-gray-700'
                  }`}>
                    {format(date, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="relative">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading appointments...</p>
                </div>
              ) : (
                timeSlots.map((time, timeIndex) => (
                  <div key={time} className="grid grid-cols-8 border-b border-gray-100">
                    <div className="p-2 text-xs text-gray-500 border-r border-gray-200">
                      {time}
                    </div>
                    {weekDates.map((date, dateIndex) => {
                      const dayAppointments = getAppointmentsForDate(date)
                      const timeAppointments = dayAppointments.filter(apt => {
                        // Match appointments that start within this hour slot
                        const aptHour = parseInt(apt.startTime.split(':')[0])
                        const slotHour = parseInt(time.split(':')[0])
                        const matches = aptHour === slotHour
                        return matches
                      })
                      
                      // Debug: Log when we have appointments for this time slot
                      if (timeAppointments.length > 0) {
                        console.log(`Rendering ${timeAppointments.length} appointments at ${time} for ${date.toDateString()}:`, timeAppointments)
                      }
                      
                      return (
                        <div
                          key={`${date.toISOString()}-${time}`}
                          className="relative p-1 border-l border-gray-200 min-h-[40px] hover:bg-gray-50"
                        >
                          {timeAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className="text-white p-1 rounded text-xs mb-1 cursor-pointer hover:opacity-80 transition-opacity shadow-sm"
                              style={{ backgroundColor: appointment.color || '#3B82F6' }}
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <div className="font-medium truncate text-xs">
                                {appointment.clientName}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-2 w-2" />
                                <span className="text-xs">{appointment.startTime}</span>
                              </div>
                              <div className="truncate text-xs opacity-90">
                                {appointment.service}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={{
            id: selectedAppointment.id,
            clientName: selectedAppointment.clientName,
            service: selectedAppointment.service,
            startTime: selectedAppointment.date.toISOString(),
            staff: selectedAppointment.staff,
            status: selectedAppointment.status
          }}
          onClose={() => setSelectedAppointment(null)}
          onMarkComplete={handleMarkComplete}
          onCancel={handleCancel}
          onEdit={() => handleEdit(selectedAppointment)}
          onDelete={() => handleDelete(selectedAppointment)}
        />
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">New Appointment</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const date = formData.get('date') as string
                const time = formData.get('time') as string
                const serviceId = formData.get('serviceId') as string
                const selectedService = services.find(s => s.id === serviceId)
                const duration = selectedService?.duration_minutes || 60

                const startTime = new Date(`${date}T${time}`)
                const endTime = new Date(startTime.getTime() + duration * 60000)

                handleCreateAppointment({
                  clientId: formData.get('clientId'),
                  staffId: formData.get('staffId'),
                  serviceId: serviceId,
                  startTime: startTime.toISOString(),
                  endTime: endTime.toISOString(),
                  notes: formData.get('notes')
                })
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select
                  name="clientId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a client</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                <select
                  name="serviceId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a service</option>
                  {services.map((service: any) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.duration_minutes} min) - ${service.price}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff *</label>
                <select
                  name="staffId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select staff member</option>
                  {staffList.map((staff: any) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.first_name} {staff.last_name} - {staff.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    name="time"
                    required
                    defaultValue="09:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special requests or notes..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Appointment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the appointment for <strong>{deleteConfirm.clientName}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Edit Appointment</h2>
              <button
                onClick={() => setEditingAppointment(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateAppointment({
                  status: formData.get('status'),
                  notes: formData.get('notes')
                })
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input
                  type="text"
                  value={editingAppointment.clientName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <input
                  type="text"
                  value={editingAppointment.service}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
                <input
                  type="text"
                  value={editingAppointment.staff}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <input
                  type="text"
                  value={`${editingAppointment.date.toLocaleDateString()} at ${editingAppointment.startTime}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingAppointment.status}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Add notes..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
