import React, { useState } from 'react'
import { Search, Plus, Mail, Phone, Calendar, DollarSign, Star, Filter } from 'lucide-react'

const mockClients = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    totalSpent: 1250,
    lastVisit: '2024-01-15',
    appointmentCount: 12,
    loyaltyPoints: 150,
    status: 'active',
    notes: 'Prefers Emma as stylist, allergic to sulfates',
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    totalSpent: 890,
    lastVisit: '2024-01-10',
    appointmentCount: 8,
    loyaltyPoints: 89,
    status: 'active',
    notes: 'Regular beard trim customer',
  },
  {
    id: '3',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@email.com',
    phone: '+1 (555) 345-6789',
    totalSpent: 2100,
    lastVisit: '2024-01-08',
    appointmentCount: 18,
    loyaltyPoints: 210,
    status: 'vip',
    notes: 'VIP client, books monthly color appointments',
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@email.com',
    phone: '+1 (555) 456-7890',
    totalSpent: 320,
    lastVisit: '2023-12-20',
    appointmentCount: 3,
    loyaltyPoints: 32,
    status: 'inactive',
    notes: 'New client, referred by Sarah Johnson',
  },
]

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = 
      client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'vip':
        return 'badge bg-yellow-100 text-yellow-800'
      case 'active':
        return 'badge-success'
      case 'inactive':
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
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
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
                  <p className="text-sm font-medium text-gray-500">Total Clients</p>
                  <p className="text-2xl font-semibold text-gray-900">{mockClients.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-success-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Clients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mockClients.filter(c => c.status === 'active' || c.status === 'vip').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">VIP Clients</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {mockClients.filter(c => c.status === 'vip').length}
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
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${mockClients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="mt-8 card">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {client.firstName[0]}{client.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.loyaltyPoints} loyalty points
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.email}</div>
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(client.status)}>
                          {client.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.appointmentCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${client.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.lastVisit).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-primary-600 hover:text-primary-900">
                            <Mail className="h-4 w-4" />
                          </button>
                          <button className="text-primary-600 hover:text-primary-900">
                            <Phone className="h-4 w-4" />
                          </button>
                          <button className="text-primary-600 hover:text-primary-900">
                            <Calendar className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
