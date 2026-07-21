import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown, Star, Award, Target, BarChart3, AlertCircle, Database } from 'lucide-react'
import axios from 'axios'
import { appointmentsAPI, clientsAPI, servicesAPI, staffAPI } from '../services/api'
import { AppointmentDetailModal } from '../components/modals'
import { featureConfigs, categoryColors, categoryLabels } from '../data/featureConfig'

interface DashboardStats {
  totalRevenue: number
  appointmentsToday: number
  newClients: number
  avgServiceTime: number
  weeklyRevenue: number
  monthlyRevenue: number
  totalStaff: number
  activeStaff: number
  completedAppointments: number
  cancelledAppointments: number
  clientRetentionRate: number
  averageBookingValue: number
}

interface RecentAppointment {
  id: string
  clientName: string
  service: string
  startTime: string
  staff: string
  status: string
  price?: number
}

interface TopService {
  name: string
  bookings: number
  revenue: number
}

interface StaffPerformance {
  name: string
  appointments: number
  revenue: number
  rating: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [selectedAppointment, setSelectedAppointment] = useState<RecentAppointment | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    appointmentsToday: 0,
    newClients: 0,
    avgServiceTime: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    totalStaff: 0,
    activeStaff: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    clientRetentionRate: 0,
    averageBookingValue: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [topServices, setTopServices] = useState<TopService[]>([])
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get today's date range
        const today = new Date()
        const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
        const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()
        
        // Fetch all data in parallel
        const [appointmentsRes, clientStatsRes, serviceStatsRes, staffStatsRes] = await Promise.all([
          appointmentsAPI.getAppointments({ start_date: startOfDay, end_date: endOfDay }),
          clientsAPI.getClientStats(),
          servicesAPI.getServiceStats(),
          staffAPI.getStaffStats()
        ])
        
        console.log('API responses:', { appointmentsRes, clientStatsRes, serviceStatsRes, staffStatsRes })
        
        const todayAppointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []
        const clientStats = clientStatsRes.data?.data || clientStatsRes.data || {}
        const serviceStats = serviceStatsRes.data?.data || serviceStatsRes.data || {}
        const staffStats = staffStatsRes.data?.data || staffStatsRes.data || {}
        
        // Calculate enhanced stats
        const completedToday = todayAppointments.filter(apt => apt.status === 'completed').length
        const cancelledToday = todayAppointments.filter(apt => apt.status === 'cancelled').length
        const totalRevenue = Number(serviceStats.monthly_revenue) || 0
        const weeklyRevenue = Number(staffStats.weekly_revenue) || 0
        
        setStats({
          totalRevenue,
          appointmentsToday: todayAppointments.length,
          newClients: Number(clientStats.total_clients) || 0,
          avgServiceTime: 45,
          weeklyRevenue,
          monthlyRevenue: totalRevenue,
          totalStaff: Number(staffStats.total_staff) || 0,
          activeStaff: Number(staffStats.active_staff) || 0,
          completedAppointments: completedToday,
          cancelledAppointments: cancelledToday,
          clientRetentionRate: 85, // This would be calculated from historical data
          averageBookingValue: todayAppointments.length > 0 ? totalRevenue / todayAppointments.length : 0
        })
        
        // Set recent appointments (limit to 5)
        setRecentAppointments(todayAppointments.slice(0, 5))
        
        // Mock top services data (in real app, this would come from API)
        setTopServices([
          { name: 'Haircut & Style', bookings: 45, revenue: 3825 },
          { name: 'Color & Highlights', bookings: 28, revenue: 4200 },
          { name: 'Beard Trim', bookings: 32, revenue: 1120 }
        ])
        
        // Mock staff performance data (in real app, this would come from API)
        setStaffPerformance([
          { name: 'Jane Smith', appointments: 24, revenue: 2040, rating: 4.8 },
          { name: 'Mike Johnson', appointments: 18, revenue: 1530, rating: 4.6 }
        ])
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleSeedDatabase = async () => {
    setSeeding(true)
    setSeedResult(null)
    try {
      const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'
      // First seed basic data, then feature data
      await axios.post(`${API_BASE}/api/debug/seed`)
      const res = await axios.post(`${API_BASE}/api/debug/seed-features`)
      setSeedResult(`Seeded: ${Object.entries(res.data.counts || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}`)
      // Refresh dashboard data
      window.location.reload()
    } catch (error: any) {
      setSeedResult(`Error: ${error.message}`)
    } finally {
      setSeeding(false)
    }
  }

  const statsConfig = [
    {
      name: 'Monthly Revenue',
      value: `$${(stats.monthlyRevenue || 0).toLocaleString()}`,
      change: '+12%',
      changeType: 'increase' as const,
      icon: DollarSign,
      route: '/payments',
    },
    {
      name: 'Appointments Today',
      value: (stats.appointmentsToday || 0).toString(),
      change: `${stats.completedAppointments}/${stats.appointmentsToday} completed`,
      changeType: 'neutral' as const,
      icon: Calendar,
      route: '/calendar',
    },
    {
      name: 'Active Staff',
      value: `${stats.activeStaff}/${stats.totalStaff}`,
      change: 'All available',
      changeType: 'increase' as const,
      icon: Users,
      route: '/staff',
    },
    {
      name: 'Weekly Revenue',
      value: `$${(stats.weeklyRevenue || 0).toLocaleString()}`,
      change: '+8%',
      changeType: 'increase' as const,
      icon: TrendingUp,
      route: '/payments',
    },
    {
      name: 'Client Retention',
      value: `${stats.clientRetentionRate}%`,
      change: '+2%',
      changeType: 'increase' as const,
      icon: Star,
      route: '/clients',
    },
    {
      name: 'Avg. Booking Value',
      value: `$${Math.round(stats.averageBookingValue || 0)}`,
      change: '+$5',
      changeType: 'increase' as const,
      icon: DollarSign,
      route: '/analytics',
    },
  ]

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card">
                  <div className="card-body">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-body">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Database className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? 'Seeding...' : 'Seed Database'}</span>
          </button>
        </div>
        {seedResult && (
          <div className={`mt-2 p-3 rounded-md text-sm ${seedResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {seedResult}
          </div>
        )}
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statsConfig.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.name}
                  className="card cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all duration-200"
                  onClick={() => navigate(stat.route)}
                >
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Icon className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {stat.name}
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {stat.value}
                            </div>
                            <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                              stat.changeType === 'increase' ? 'text-success-600' :
                              String(stat.changeType) === 'decrease' ? 'text-error-600' : 'text-gray-600'
                            }`}>
                              {stat.changeType === 'increase' ? (
                                <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                              ) : String(stat.changeType) === 'decrease' ? (
                                <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
                              ) : (
                                <BarChart3 className="self-center flex-shrink-0 h-4 w-4 text-gray-500" />
                              )}
                              <span className="ml-1">{stat.change}</span>
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Appointments */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Today's Appointments
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {stats.appointmentsToday} appointments scheduled • {stats.completedAppointments} completed
                </p>
              </div>
              <div className="card-body">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {recentAppointments.length > 0 ? (
                      recentAppointments.map((appointment) => (
                        <li
                          key={appointment.id}
                          className="py-4 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                          onClick={() => setSelectedAppointment(appointment)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                  {appointment.clientName ? appointment.clientName.split(' ').map(n => n[0]).join('') : 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {appointment.clientName || 'Unknown Client'}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {appointment.service || 'Unknown Service'} • {appointment.staff || 'Unknown Staff'}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-sm text-gray-500">
                              {appointment.startTime || 'No time'}
                            </div>
                            <div className="flex-shrink-0">
                              <span className={`badge ${
                                appointment.status === 'confirmed' ? 'badge-success' :
                                appointment.status === 'in_progress' ? 'badge-warning' :
                                appointment.status === 'completed' ? 'badge-success' :
                                appointment.status === 'cancelled' ? 'badge-error' :
                                'badge-info'
                              }`}>
                                {appointment.status ? appointment.status.replace('_', ' ') : 'unknown'}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-4 text-center text-gray-500">
                        No appointments scheduled for today
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Top Services */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Top Services
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This month's performance
                </p>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {topServices.map((service, index) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                      onClick={() => navigate('/services')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-orange-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-500">{service.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        ${service.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Staff Performance
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                This week's staff metrics
              </p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staffPerformance.map((staff) => (
                  <div
                    key={staff.name}
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => navigate('/staff')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-500">{staff.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">${staff.revenue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{staff.appointments} appointments</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(staff.appointments / 30) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Feature Status */}
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Feature Status
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {featureConfigs.length} features intentionally not implemented
                  </p>
                </div>
                <button
                  onClick={() => navigate('/features')}
                  className="btn btn-secondary text-sm"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {featureConfigs.map((feature) => {
                  const FeatureIcon = feature.icon
                  return (
                    <div
                      key={feature.id}
                      onClick={() => navigate(feature.redirectTo || `/features/${feature.id}`)}
                      className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-red-50 cursor-pointer transition-colors group border border-transparent hover:border-red-200"
                    >
                      <FeatureIcon className="h-5 w-5 text-gray-400 group-hover:text-red-500 mb-2" />
                      <p className="text-xs font-medium text-gray-700 text-center leading-tight mb-1">{feature.name}</p>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600">
                        Missing
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onMarkComplete={() => {
            // Handle mark complete
            setSelectedAppointment(null)
          }}
          onCancel={() => {
            // Handle cancel
            setSelectedAppointment(null)
          }}
        />
      )}
    </div>
  )
}
