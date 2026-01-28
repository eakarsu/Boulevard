import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Mail, Phone, Calendar, DollarSign, Clock, Star, Search, Filter, Edit2, Trash2 } from 'lucide-react'
import { staffAPI } from '../services/api'
import { StaffDetailModal } from '../components/modals'

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

interface StaffStats {
  total_staff: number
  active_staff: number
  weekly_revenue: number
  weekly_appointments: number
}

export default function Staff() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [stats, setStats] = useState<StaffStats>({
    total_staff: 0,
    active_staff: 0,
    weekly_revenue: 0,
    weekly_appointments: 0
  })
  const [loading, setLoading] = useState(true)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<StaffMember | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchStaff()
    fetchStats()
  }, [searchTerm, statusFilter])

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const params = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      }
      
      const response = await staffAPI.getStaff(params)
      setStaff(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (error) {
      console.error('Error fetching staff:', error)
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await staffAPI.getStaffStats()
      setStats(response.data?.data || {
        total_staff: 0,
        active_staff: 0,
        weekly_revenue: 0,
        weekly_appointments: 0
      })
    } catch (error) {
      console.error('Error fetching staff stats:', error)
      setStats({
        total_staff: 0,
        active_staff: 0,
        weekly_revenue: 0,
        weekly_appointments: 0
      })
    }
  }

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'Available':
        return 'badge-success'
      case 'Busy':
        return 'badge-warning'
      case 'Off Today':
        return 'badge bg-gray-100 text-gray-800'
      default:
        return 'badge-info'
    }
  }

  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(null)
    setEditingStaff(staff)
  }

  const handleDelete = (staff: StaffMember) => {
    setSelectedStaff(null)
    setDeleteConfirm(staff)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await staffAPI.deleteStaff(deleteConfirm.id)
      setDeleteConfirm(null)
      fetchStaff()
      fetchStats()
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Failed to delete staff member')
    }
  }

  const handleUpdateStaff = async (updatedData: any) => {
    if (!editingStaff) return
    try {
      await staffAPI.updateStaff(editingStaff.id, updatedData)
      setEditingStaff(null)
      fetchStaff()
    } catch (error) {
      console.error('Error updating staff:', error)
      alert('Failed to update staff member')
    }
  }

  const handleCreateStaff = async (staffData: any) => {
    try {
      await staffAPI.createStaff(staffData)
      setShowCreateModal(false)
      fetchStaff()
      fetchStats()
    } catch (error) {
      console.error('Error creating staff:', error)
      alert('Failed to create staff member')
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Staff</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_staff}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-success-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Staff</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active_staff}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Weekly Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${stats.weekly_revenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Weekly Appointments</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.weekly_appointments}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="input w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Staff</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            Array.isArray(staff) && staff.map((staffMember) => (
            <div
              key={staffMember.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedStaff(staffMember)}
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {staffMember.first_name[0]}{staffMember.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {staffMember.first_name} {staffMember.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{staffMember.title}</p>
                    </div>
                  </div>
                  <span className={getAvailabilityBadge(staffMember.availability)}>
                    {staffMember.availability}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{staffMember.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({staffMember.review_count} reviews)</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {staffMember.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="badge badge-info text-xs">
                        {skill}
                      </span>
                    ))}
                    {staffMember.skills.length > 3 && (
                      <span className="badge bg-gray-100 text-gray-600 text-xs">
                        +{staffMember.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Today</p>
                    <p className="font-medium">{staffMember.appointments_today} appointments</p>
                  </div>
                  <div>
                    <p className="text-gray-500">This Week</p>
                    <p className="font-medium">{staffMember.appointments_this_week} appointments</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Commission</p>
                    <p className="font-medium">{staffMember.commission_rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-medium">${staffMember.revenue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      onClick={() => window.location.href = `mailto:${staffMember.email}`}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      onClick={() => window.location.href = `tel:${staffMember.phone}`}
                    >
                      <Phone className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      onClick={() => navigate('/calendar')}
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                  <span className={`badge ${staffMember.is_active ? 'badge-success' : 'badge bg-gray-100 text-gray-800'}`}>
                    {staffMember.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {!loading && staff.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">No staff members found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <StaffDetailModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onViewSchedule={() => {
            setSelectedStaff(null)
            navigate('/calendar')
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Add New Staff Member</h2>
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
                handleCreateStaff({
                  firstName: formData.get('first_name'),
                  lastName: formData.get('last_name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  title: formData.get('title'),
                  skills: (formData.get('skills') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
                  commissionRate: parseFloat(formData.get('commission_rate') as string) || 0,
                  hourlyRate: parseFloat(formData.get('hourly_rate') as string) || 0
                })
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Senior Stylist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  placeholder="e.g., Cutting, Styling, Color"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    name="commission_rate"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue="40"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    step="0.01"
                    min="0"
                    defaultValue="25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Staff Member
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Staff Member</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn bg-red-600 hover:bg-red-700 text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Edit Staff Member</h2>
              <button onClick={() => setEditingStaff(null)} className="p-2 hover:bg-gray-100 rounded-full">
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
                handleUpdateStaff({
                  first_name: formData.get('first_name'),
                  last_name: formData.get('last_name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  title: formData.get('title'),
                  commission_rate: parseFloat(formData.get('commission_rate') as string),
                  hourly_rate: parseFloat(formData.get('hourly_rate') as string),
                  is_active: formData.get('is_active') === 'true'
                })
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    defaultValue={editingStaff.first_name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    defaultValue={editingStaff.last_name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingStaff.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingStaff.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingStaff.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    name="commission_rate"
                    step="0.01"
                    defaultValue={editingStaff.commission_rate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                  <input
                    type="number"
                    name="hourly_rate"
                    step="0.01"
                    defaultValue={editingStaff.hourly_rate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="is_active"
                  defaultValue={editingStaff.is_active.toString()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingStaff(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
