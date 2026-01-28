import React from 'react'
import { X, User, Calendar, Clock, DollarSign, MapPin, FileText, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react'

interface Appointment {
  id: string
  clientName: string
  service: string
  startTime: string
  staff: string
  status: string
  price?: number
}

interface AppointmentDetailModalProps {
  appointment: Appointment
  onClose: () => void
  onMarkComplete?: (appointment: Appointment) => void
  onCancel?: (appointment: Appointment) => void
  onEdit?: (appointment: Appointment) => void
  onDelete?: (appointment: Appointment) => void
}

export default function AppointmentDetailModal({ appointment, onClose, onMarkComplete, onCancel, onEdit, onDelete }: AppointmentDetailModalProps) {
  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Not specified'
    try {
      return new Date(timeStr).toLocaleString()
    } catch {
      return timeStr
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
            <p className="text-sm text-gray-500">#{appointment.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(appointment.status)}`}>
              {appointment.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </span>
          </div>

          {/* Client Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Client</h3>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {appointment.clientName ? appointment.clientName.split(' ').map(n => n[0]).join('') : '??'}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{appointment.clientName || 'Unknown Client'}</p>
              </div>
            </div>
          </div>

          {/* Service & Staff */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Service</h3>
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{appointment.service || 'Not specified'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Staff</h3>
              <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{appointment.staff || 'Not assigned'}</span>
              </div>
            </div>
          </div>

          {/* Time */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Schedule</h3>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{formatTime(appointment.startTime)}</p>
              </div>
            </div>
          </div>

          {/* Price */}
          {appointment.price && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-green-700">Service Price</span>
                </div>
                <span className="text-2xl font-bold text-green-900">${appointment.price}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit?.(appointment)}
              className="btn bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete?.(appointment)}
              className="btn bg-red-100 hover:bg-red-200 text-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => onCancel?.(appointment)}
                  className="btn bg-orange-100 hover:bg-orange-200 text-orange-700 flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => onMarkComplete?.(appointment)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Mark Complete</span>
                </button>
              </>
            )}
            {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
              <button onClick={onClose} className="btn btn-secondary">
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
