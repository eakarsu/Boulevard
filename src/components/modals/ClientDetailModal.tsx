import React from 'react'
import { X, Mail, Phone, Calendar, DollarSign, Star, Clock, User, Edit2, Trash2 } from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  total_spent: number
  last_visit: string
  appointment_count: number
  status: string
  notes?: string
}

interface ClientDetailModalProps {
  client: Client
  onClose: () => void
  onBookAppointment?: (client: Client) => void
  onSendEmail?: (client: Client) => void
  onEdit?: (client: Client) => void
  onDelete?: (client: Client) => void
}

export default function ClientDetailModal({ client, onClose, onBookAppointment, onSendEmail, onEdit, onDelete }: ClientDetailModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vip':
        return 'bg-yellow-100 text-yellow-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {client.first_name[0]}{client.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {client.first_name} {client.last_name}
              </h2>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(client.status)}`}>
                {client.status.toUpperCase()}
              </span>
            </div>
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
          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact Information</h3>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <a href={`mailto:${client.email}`} className="text-primary-600 hover:underline">
                {client.email}
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <a href={`tel:${client.phone}`} className="text-primary-600 hover:underline">
                {client.phone}
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-primary-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">{client.appointment_count}</p>
              <p className="text-xs text-gray-500">Total Visits</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-2xl font-semibold text-gray-900">${client.total_spent.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {client.last_visit ? new Date(client.last_visit).toLocaleDateString() : 'Never'}
              </p>
              <p className="text-xs text-gray-500">Last Visit</p>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Notes</h3>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit?.(client)}
              className="btn bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center space-x-2"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete?.(client)}
              className="btn bg-red-100 hover:bg-red-200 text-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onSendEmail?.(client)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Mail className="h-4 w-4" />
              <span>Send Email</span>
            </button>
            <button
              onClick={() => onBookAppointment?.(client)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
