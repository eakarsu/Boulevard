import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, User, MapPin } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns'
import { appointmentsAPI } from '../services/api'

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

const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 8 // Start from 8 AM
  return `${hour.toString().padStart(2, '0')}:00`
})

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [view, setView] = useState<'week' | 'day'>('week')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const weekStart = startOfWeek(currentWeek)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    fetchAppointments()
  }, [currentWeek])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const weekEnd = addDays(weekStart, 6)
      
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
        console.log('First appointment date object:', transformedAppointments[0].date)
        console.log('First appointment date string:', transformedAppointments[0].date.toDateString())
        console.log('Current week start:', weekStart.toDateString())
        console.log('Current week dates:', weekDates.map(d => d.toDateString()))
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
        return 'bg-blue-500'
      case 'in_progress':
        return 'bg-green-500'
      case 'completed':
        return 'bg-gray-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-purple-500'
    }
  }

  const getAppointmentsForDate = (date: Date) => {
    const filtered = appointments.filter(apt => {
      const aptDate = new Date(apt.date)
      const matches = isSameDay(aptDate, date)
      console.log(`Checking appointment ${apt.id}: ${aptDate.toDateString()} vs ${date.toDateString()} = ${matches}`)
      return matches
    })
    console.log(`Appointments for ${date.toDateString()}:`, filtered.length)
    return filtered
  }

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1))
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1))

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
            <button className="btn-primary">
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
                    <div className="p-4 text-sm text-gray-500 border-r border-gray-200">
                      {time}
                    </div>
                    {weekDates.map((date, dateIndex) => {
                      const dayAppointments = getAppointmentsForDate(date)
                      const timeAppointments = dayAppointments.filter(apt => {
                        // Match appointments that start at this hour
                        const aptHour = apt.startTime.split(':')[0] + ':00'
                        const matches = aptHour === time
                        if (matches) {
                          console.log(`Rendering appointment ${apt.id} at ${time}:`, apt)
                        }
                        return matches
                      })
                      
                      return (
                        <div
                          key={`${date.toISOString()}-${time}`}
                          className="relative p-2 border-l border-gray-200 min-h-[60px] hover:bg-gray-50"
                        >
                          {timeAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className={`${appointment.color} text-white p-2 rounded-md text-xs mb-1 cursor-pointer hover:opacity-90`}
                            >
                              <div className="font-medium truncate">
                                {appointment.clientName}
                              </div>
                              <div className="flex items-center space-x-1 mt-1">
                                <Clock className="h-3 w-3" />
                                <span>{appointment.startTime}-{appointment.endTime}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span className="truncate">{appointment.staff}</span>
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
    </div>
  )
}
