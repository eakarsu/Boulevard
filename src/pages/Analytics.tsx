import React, { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Calendar,
  Clock, Star, Target, Award, ArrowUpRight, ArrowDownRight, Download
} from 'lucide-react'
import { analyticsAPI } from '../services/api'

interface DashboardData {
  revenue: {
    total: number
    tips: number
    transactions: number
    avgValue: number
    changePercent: number
  }
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShows: number
    upcoming: number
    today: number
  }
  clients: {
    total: number
    new: number
  }
}

interface StaffPerformance {
  staff_id: string
  first_name: string
  last_name: string
  title: string
  total_appointments: number
  completed_appointments: number
  total_revenue: number
  total_tips: number
  avg_rating: number
  completion_rate: number
}

interface ServicePerformance {
  service_id: string
  name: string
  category_name: string
  total_bookings: number
  completed_bookings: number
  total_revenue: number
  cancellation_rate: number
}

interface ClientInsights {
  segments: {
    vip_clients: number
    regular_clients: number
    occasional_clients: number
    new_clients: number
    inactive_clients: number
  }
  topClients: any[]
  retentionRate: number
}

interface RevenueData {
  period: string
  revenue: number
  tips: number
  transactions: number
}

export default function Analytics() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([])
  const [clientInsights, setClientInsights] = useState<ClientInsights | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'services' | 'clients'>('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [dashboardRes, staffRes, serviceRes, clientRes, revenueRes] = await Promise.all([
        analyticsAPI.getDashboard(period),
        analyticsAPI.getStaffPerformance(startDate, endDate),
        analyticsAPI.getServicePerformance(startDate, endDate),
        analyticsAPI.getClientInsights(),
        analyticsAPI.getRevenue(startDate, endDate, 'day')
      ])

      setDashboard(dashboardRes.data?.data || null)
      setStaffPerformance(staffRes.data?.data || [])
      setServicePerformance(serviceRes.data?.data || [])
      setClientInsights(clientRes.data?.data || null)
      setRevenueData(revenueRes.data?.data || [])
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  const formatPercent = (value: number) => {
    return `${(value || 0).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Comprehensive business insights and performance metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button className="btn btn-secondary flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'staff', label: 'Staff Performance', icon: Users },
              { id: 'services', label: 'Service Analytics', icon: Calendar },
              { id: 'clients', label: 'Client Insights', icon: Target }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.revenue.total)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  {Number(dashboard.revenue.changePercent) >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${Number(dashboard.revenue.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dashboard.revenue.changePercent}%
                  </span>
                  <span className="text-sm text-gray-500 ml-2">vs previous period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Appointments</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.appointments.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-sm">
                  <span className="text-green-600">{dashboard.appointments.completed} completed</span>
                  <span className="text-red-600">{dashboard.appointments.cancelled} cancelled</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboard.clients.total}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-green-600">+{dashboard.clients.new} new this period</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Avg. Transaction</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboard.revenue.avgValue)}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">{dashboard.revenue.transactions} transactions</span>
                </div>
              </div>
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Revenue chart visualization</p>
                  <p className="text-sm text-gray-400">{revenueData.length} data points loaded</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{formatCurrency(dashboard.revenue.tips)}</p>
                <p className="text-sm text-gray-500">Total Tips</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">{dashboard.appointments.today}</p>
                <p className="text-sm text-gray-500">Today's Appointments</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">{dashboard.appointments.upcoming}</p>
                <p className="text-sm text-gray-500">Upcoming</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <p className="text-3xl font-bold text-red-600">{dashboard.appointments.noShows}</p>
                <p className="text-sm text-gray-500">No Shows</p>
              </div>
            </div>
          </div>
        )}

        {/* Staff Performance Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Staff Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tips</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffPerformance.map((staff) => (
                      <tr key={staff.staff_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {staff.first_name?.[0]}{staff.last_name?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {staff.first_name} {staff.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{staff.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{staff.completed_appointments}/{staff.total_appointments}</div>
                          <div className="text-xs text-gray-500">completed</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(staff.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(staff.total_tips)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-900">{(staff.avg_rating || 0).toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${staff.completion_rate || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">{formatPercent(staff.completion_rate)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {staffPerformance.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No staff performance data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Service Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancellation Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {servicePerformance.map((service) => (
                      <tr key={service.service_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {service.category_name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{service.completed_bookings}/{service.total_bookings}</div>
                          <div className="text-xs text-gray-500">completed</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(service.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${service.cancellation_rate > 20 ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatPercent(service.cancellation_rate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {servicePerformance.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No service performance data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && clientInsights && (
          <div className="space-y-6">
            {/* Client Segments */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'VIP Clients', value: clientInsights.segments.vip_clients, color: 'bg-yellow-100 text-yellow-800' },
                { label: 'Regular', value: clientInsights.segments.regular_clients, color: 'bg-green-100 text-green-800' },
                { label: 'Occasional', value: clientInsights.segments.occasional_clients, color: 'bg-blue-100 text-blue-800' },
                { label: 'New', value: clientInsights.segments.new_clients, color: 'bg-purple-100 text-purple-800' },
                { label: 'Inactive', value: clientInsights.segments.inactive_clients, color: 'bg-gray-100 text-gray-800' }
              ].map((segment) => (
                <div key={segment.label} className="bg-white rounded-lg shadow p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${segment.color}`}>
                    {segment.label}
                  </span>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{segment.value}</p>
                </div>
              ))}
            </div>

            {/* Retention Rate */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Client Retention Rate</h3>
                  <p className="text-sm text-gray-500">Percentage of clients who return</p>
                </div>
                <div className="text-4xl font-bold text-green-600">
                  {formatPercent(clientInsights.retentionRate)}
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{ width: `${clientInsights.retentionRate}%` }}
                />
              </div>
            </div>

            {/* Top Clients */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Clients</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {clientInsights.topClients.slice(0, 10).map((client, index) => (
                  <div key={client.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(client.total_spent)}</p>
                      <p className="text-xs text-gray-500">{client.appointment_count} appointments</p>
                    </div>
                  </div>
                ))}
                {clientInsights.topClients.length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No client data available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
