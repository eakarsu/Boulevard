import React, { useState, useEffect } from 'react'
import { Plus, Mail, Phone, Calendar, DollarSign, Clock, Star, Search, Filter } from 'lucide-react'
import { staffAPI } from '../services/api'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [stats, setStats] = useState<StaffStats>({
    total_staff: 0,
    active_staff: 0,
    weekly_revenue: 0,
    weekly_appointments: 0
  })
  const [loading, setLoading] = useState(true)

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


  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
          <button className="btn-primary">
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
            <div key={staffMember.id} className="card hover:shadow-lg transition-shadow">
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
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                      <Mail className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
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
    </div>
  )
}
