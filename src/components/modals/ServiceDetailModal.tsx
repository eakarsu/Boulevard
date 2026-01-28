import React from 'react'
import { X, Clock, DollarSign, Users, Calendar, Edit, BarChart3, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  category: string
  duration_minutes: number
  price: number
  description?: string
  color: string
  is_active: boolean
  staff_count: number
  bookings_this_month: number
}

interface ServiceDetailModalProps {
  service: Service
  onClose: () => void
  onEdit?: (service: Service) => void
  onDelete?: (service: Service) => void
}

export default function ServiceDetailModal({ service, onClose, onEdit, onDelete }: ServiceDetailModalProps) {
  const revenue = service.price * service.bookings_this_month

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: service.color + '20' }}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: service.color }}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
              <p className="text-sm text-gray-500">{service.category}</p>
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
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {service.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Description */}
          {service.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</h3>
              <p className="text-gray-700">{service.description}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{service.duration_minutes}</p>
                  <p className="text-xs text-gray-500">Minutes</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">${service.price}</p>
                  <p className="text-xs text-gray-500">Price</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{service.staff_count}</p>
                  <p className="text-xs text-gray-500">Staff Members</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{service.bookings_this_month}</p>
                  <p className="text-xs text-gray-500">Bookings This Month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-primary-700">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-primary-900">${revenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={() => onDelete?.(service)}
            className="btn bg-red-100 hover:bg-red-200 text-red-700 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
            <button
              onClick={() => onEdit?.(service)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
