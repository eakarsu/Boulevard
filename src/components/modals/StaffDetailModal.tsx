import React from 'react'
import { X, Mail, Phone, Calendar, DollarSign, Star, Clock, Award, Edit, Trash2 } from 'lucide-react'

interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  title: string
  avatar_url?: string
  skills: string[]
  commission_rate: number
  hourly_rate: number
  is_active: boolean
  appointments_today: number
  appointments_this_week: number
  revenue: number
  rating: number
  review_count: number
  availability: string
}

interface StaffDetailModalProps {
  staff: StaffMember
  onClose: () => void
  onViewSchedule?: (staff: StaffMember) => void
  onEdit?: (staff: StaffMember) => void
  onDelete?: (staff: StaffMember) => void
}

export default function StaffDetailModal({ staff, onClose, onViewSchedule, onEdit, onDelete }: StaffDetailModalProps) {
  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'bg-green-100 text-green-800'
      case 'Busy':
        return 'bg-yellow-100 text-yellow-800'
      case 'Off Today':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-xl font-medium text-white">
                {staff.first_name[0]}{staff.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {staff.first_name} {staff.last_name}
              </h2>
              <p className="text-sm text-gray-500">{staff.title}</p>
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
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getAvailabilityBadge(staff.availability)}`}>
                {staff.availability}
              </span>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                staff.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {staff.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="font-medium">{staff.rating.toFixed(1)}</span>
              <span className="text-gray-500">({staff.review_count} reviews)</span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact Information</h3>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <a href={`mailto:${staff.email}`} className="text-primary-600 hover:underline">
                {staff.email}
              </a>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <a href={`tel:${staff.phone}`} className="text-primary-600 hover:underline">
                {staff.phone}
              </a>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {staff.skills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{staff.appointments_today}</p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{staff.appointments_this_week}</p>
                  <p className="text-xs text-gray-500">This Week</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">${staff.revenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{staff.commission_rate}%</p>
                  <p className="text-xs text-gray-500">Commission</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-green-700">Hourly Rate</span>
              <span className="text-2xl font-bold text-green-900">${staff.hourly_rate}/hr</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg sticky bottom-0">
          <button
            onClick={() => onDelete?.(staff)}
            className="btn bg-red-100 hover:bg-red-200 text-red-700 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onViewSchedule?.(staff)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Calendar className="h-4 w-4" />
              <span>View Schedule</span>
            </button>
            <button
              onClick={() => onEdit?.(staff)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
