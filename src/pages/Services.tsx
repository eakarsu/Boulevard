import React, { useState } from 'react'
import { Plus, Clock, DollarSign, Users, Edit, Trash2, Search } from 'lucide-react'

const mockServices = [
  {
    id: '1',
    name: 'Haircut & Style',
    category: 'Hair',
    duration: 60,
    price: 85,
    description: 'Professional haircut with wash and style',
    color: '#3B82F6',
    isActive: true,
    staffCount: 3,
    bookingsThisMonth: 45,
  },
  {
    id: '2',
    name: 'Color & Highlights',
    category: 'Hair',
    duration: 120,
    price: 150,
    description: 'Full color service with highlights',
    color: '#8B5CF6',
    isActive: true,
    staffCount: 2,
    bookingsThisMonth: 28,
  },
  {
    id: '3',
    name: 'Beard Trim',
    category: 'Grooming',
    duration: 30,
    price: 35,
    description: 'Professional beard trimming and shaping',
    color: '#10B981',
    isActive: true,
    staffCount: 2,
    bookingsThisMonth: 32,
  },
  {
    id: '4',
    name: 'Deep Conditioning Treatment',
    category: 'Hair',
    duration: 45,
    price: 65,
    description: 'Intensive hair treatment for damaged hair',
    color: '#F59E0B',
    isActive: true,
    staffCount: 3,
    bookingsThisMonth: 18,
  },
  {
    id: '5',
    name: 'Eyebrow Shaping',
    category: 'Beauty',
    duration: 20,
    price: 25,
    description: 'Professional eyebrow shaping and trimming',
    color: '#EF4444',
    isActive: false,
    staffCount: 1,
    bookingsThisMonth: 0,
  },
]

const categories = ['All', 'Hair', 'Grooming', 'Beauty', 'Nails', 'Spa']

export default function Services() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredServices = mockServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalRevenue = mockServices.reduce((sum, service) => 
    sum + (service.price * service.bookingsThisMonth), 0
  )

  const totalBookings = mockServices.reduce((sum, service) => 
    sum + service.bookingsThisMonth, 0
  )

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
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
                  <p className="text-2xl font-semibold text-gray-900">{mockServices.length}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">
                    {mockServices.filter(s => s.isActive).length}
                  </p>
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
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalBookings}</p>
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
          {filteredServices.map((service) => (
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
                    <span className="text-sm text-gray-600">{service.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">${service.price}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{service.staffCount} staff</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {service.bookingsThisMonth} bookings
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`badge ${service.isActive ? 'badge-success' : 'badge bg-gray-100 text-gray-800'}`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    ${(service.price * service.bookingsThisMonth).toLocaleString()} revenue
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500">No services found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
