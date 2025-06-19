import React, { useState, useEffect } from 'react'
import { Plus, Clock, DollarSign, Users, Edit, Trash2, Search } from 'lucide-react'
import { servicesAPI } from '../services/api'

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

interface ServiceStats {
  total_services: number
  active_services: number
  monthly_revenue: number
  total_bookings: number
}

const categories = ['All', 'Hair', 'Grooming', 'Beauty', 'Nails', 'Spa']

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState<ServiceStats>({
    total_services: 0,
    active_services: 0,
    monthly_revenue: 0,
    total_bookings: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchServices()
    fetchStats()
  }, [searchTerm, selectedCategory])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = {
        search: searchTerm || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined
      }
      
      const response = await servicesAPI.getServices(params)
      setServices(Array.isArray(response.data?.data) ? response.data.data : [])
    } catch (error) {
      console.error('Error fetching services:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await servicesAPI.getServiceStats()
      setStats(response.data?.data || {
        total_services: 0,
        active_services: 0,
        monthly_revenue: 0,
        total_bookings: 0
      })
    } catch (error) {
      console.error('Error fetching service stats:', error)
      setStats({
        total_services: 0,
        active_services: 0,
        monthly_revenue: 0,
        total_bookings: 0
      })
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <button 
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Services</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_services}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-success-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Services</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.active_services}</p>
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
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${stats.monthly_revenue.toLocaleString()}
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
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_bookings}</p>
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
              placeholder="Search services..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            Array.isArray(services) && services.map((service) => (
            <div key={service.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: service.color }}
                    ></div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-600">{service.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{service.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">${service.price}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{service.staff_count} staff</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {service.bookings_this_month} bookings
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`badge ${service.is_active ? 'badge-success' : 'badge bg-gray-100 text-gray-800'}`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    ${(service.price * service.bookings_this_month).toLocaleString()} revenue
                  </span>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {!loading && services.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">No services found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
