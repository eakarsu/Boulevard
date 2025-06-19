import React, { useState } from 'react'
import { Plus, Mail, Phone, Calendar, DollarSign, Clock, Star, Search, Filter } from 'lucide-react'

const mockStaff = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'Wilson',
    email: 'emma.wilson@salon.com',
    phone: '+1 (555) 111-2222',
    title: 'Senior Hair Stylist',
    avatar: null,
    skills: ['Haircuts', 'Color', 'Highlights', 'Styling'],
    commissionRate: 45,
    hourlyRate: 35,
    isActive: true,
    appointmentsToday: 8,
    appointmentsThisWeek: 32,
    revenue: 2850,
    rating: 4.9,
    reviewCount: 127,
    availability: 'Available',
  },
  {
    id: '2',
    firstName: 'James',
    lastName: 'Rodriguez',
    email: 'james.rodriguez@salon.com',
    phone: '+1 (555) 222-3333',
    title: 'Barber',
    avatar: null,
    skills: ['Haircuts', 'Beard Trim', 'Shaving', 'Styling'],
    commissionRate: 40,
    hourlyRate: 30,
    isActive: true,
    appointmentsToday: 6,
    appointmentsThisWeek: 28,
    revenue: 1950,
    rating: 4.8,
    reviewCount: 89,
    availability: 'Busy',
  },
  {
    id: '3',
    firstName: 'Sofia',
    lastName: 'Martinez',
    email: 'sofia.martinez@salon.com',
    phone: '+1 (555) 333-4444',
    title: 'Color Specialist',
    avatar: null,
    skills: ['Color', 'Highlights', 'Balayage', 'Treatments'],
    commissionRate: 50,
    hourlyRate: 40,
    isActive: true,
    appointmentsToday: 4,
    appointmentsThisWeek: 20,
    revenue: 3200,
    rating: 4.9,
    reviewCount: 156,
    availability: 'Available',
  },
  {
    id: '4',
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'michael.thompson@salon.com',
    phone: '+1 (555) 444-5555',
    title: 'Junior Stylist',
    avatar: null,
    skills: ['Haircuts', 'Washing', 'Basic Styling'],
    commissionRate: 35,
    hourlyRate: 25,
    isActive: false,
    appointmentsToday: 0,
    appointmentsThisWeek: 0,
    revenue: 0,
    rating: 4.5,
    reviewCount: 23,
    availability: 'Off Today',
  },
]

export default function Staff() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredStaff = mockStaff.filter(staff => {
    const matchesSearch = 
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && staff.isActive) ||
      (statusFilter === 'inactive' && !staff.isActive)
    
    return matchesSearch && matchesStatus
  })

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

  const totalRevenue = mockStaff.reduce((sum, staff) => sum + staff.revenue, 0)
  const activeStaff = mockStaff.filter(staff => staff.isActive).length
  const totalAppointments = mockStaff.reduce((sum, staff) => sum + staff.appointmentsThisWeek, 0)

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
                  <p className="text-2xl font-semibold text-gray-900">{mockStaff.length}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{activeStaff}</p>
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
                    ${totalRevenue.toLocaleString()}
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
                  <p className="text-2xl font-semibold text-gray-900">{totalAppointments}</p>
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
          {filteredStaff.map((staff) => (
            <div key={staff.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {staff.firstName[0]}{staff.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {staff.firstName} {staff.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{staff.title}</p>
                    </div>
                  </div>
                  <span className={getAvailabilityBadge(staff.availability)}>
                    {staff.availability}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center space-x-1 mb-2">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{staff.rating}</span>
                    <span className="text-sm text-gray-500">({staff.reviewCount} reviews)</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {staff.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="badge badge-info text-xs">
                        {skill}
                      </span>
                    ))}
                    {staff.skills.length > 3 && (
                      <span className="badge bg-gray-100 text-gray-600 text-xs">
                        +{staff.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Today</p>
                    <p className="font-medium">{staff.appointmentsToday} appointments</p>
                  </div>
                  <div>
                    <p className="text-gray-500">This Week</p>
                    <p className="font-medium">{staff.appointmentsThisWeek} appointments</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Commission</p>
                    <p className="font-medium">{staff.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Revenue</p>
                    <p className="font-medium">${staff.revenue.toLocaleString()}</p>
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
                  <span className={`badge ${staff.isActive ? 'badge-success' : 'badge bg-gray-100 text-gray-800'}`}>
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">No staff members found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
