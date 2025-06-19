import React, { useState, useEffect } from 'react'
import { Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { appointmentsAPI, clientsAPI, servicesAPI, staffAPI } from '../services/api'

interface DashboardStats {
  totalRevenue: number
  appointmentsToday: number
  newClients: number
  avgServiceTime: number
}

interface RecentAppointment {
  id: string
  clientName: string
  service: string
  startTime: string
  staff: string
  status: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    appointmentsToday: 0,
    newClients: 0,
    avgServiceTime: 0
  })
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([])
  const [loading, setLoading] = useState(true)

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
        const clientStats = clientStatsRes.data || {}
        const serviceStats = serviceStatsRes.data || {}
        
        // Calculate stats with proper fallbacks
        setStats({
          totalRevenue: Number(serviceStats.monthly_revenue) || 0,
          appointmentsToday: todayAppointments.length,
          newClients: Number(clientStats.total_clients) || 0,
          avgServiceTime: 45 // This would need to be calculated from actual data
        })
        
        // Set recent appointments (limit to 3)
        setRecentAppointments(todayAppointments.slice(0, 3))
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const statsConfig = [
    {
      name: 'Total Revenue',
      value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
      change: '+12%', // This would need historical data to calculate
      changeType: 'increase' as const,
      icon: DollarSign,
    },
    {
      name: 'Appointments Today',
      value: (stats.appointmentsToday || 0).toString(),
      change: '+3', // This would need historical data to calculate
      changeType: 'increase' as const,
      icon: Calendar,
    },
    {
      name: 'New Clients',
      value: (stats.newClients || 0).toString(),
      change: '+2', // This would need historical data to calculate
      changeType: 'increase' as const,
      icon: Users,
    },
    {
      name: 'Avg. Service Time',
      value: `${stats.avgServiceTime || 0}min`,
      change: '-5min', // This would need historical data to calculate
      changeType: 'decrease' as const,
      icon: Clock,
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
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statsConfig.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.name} className="card">
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
                              stat.changeType === 'increase' ? 'text-success-600' : 'text-error-600'
                            }`}>
                              {stat.changeType === 'increase' ? (
                                <TrendingUp className="self-center flex-shrink-0 h-4 w-4 text-success-500" />
                              ) : (
                                <TrendingDown className="self-center flex-shrink-0 h-4 w-4 text-error-500" />
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

        {/* Recent Appointments */}
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Today's Appointments
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Upcoming appointments for today
              </p>
            </div>
            <div className="card-body">
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentAppointments.length > 0 ? (
                    recentAppointments.map((appointment) => (
                      <li key={appointment.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
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
      </div>
    </div>
  )
}
