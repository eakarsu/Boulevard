import React from 'react'
import { Calendar, Users, DollarSign, Clock, TrendingUp, TrendingDown } from 'lucide-react'

const stats = [
  {
    name: 'Total Revenue',
    value: '$12,426',
    change: '+12%',
    changeType: 'increase',
    icon: DollarSign,
  },
  {
    name: 'Appointments Today',
    value: '24',
    change: '+3',
    changeType: 'increase',
    icon: Calendar,
  },
  {
    name: 'New Clients',
    value: '8',
    change: '+2',
    changeType: 'increase',
    icon: Users,
  },
  {
    name: 'Avg. Service Time',
    value: '45min',
    change: '-5min',
    changeType: 'decrease',
    icon: Clock,
  },
]

const recentAppointments = [
  {
    id: '1',
    client: 'Sarah Johnson',
    service: 'Haircut & Style',
    time: '10:00 AM',
    staff: 'Emma Wilson',
    status: 'confirmed',
  },
  {
    id: '2',
    client: 'Michael Chen',
    service: 'Beard Trim',
    time: '11:30 AM',
    staff: 'James Rodriguez',
    status: 'in_progress',
  },
  {
    id: '3',
    client: 'Lisa Anderson',
    service: 'Color & Highlights',
    time: '2:00 PM',
    staff: 'Emma Wilson',
    status: 'scheduled',
  },
]

export default function Dashboard() {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Stats */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
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
                  {recentAppointments.map((appointment) => (
                    <li key={appointment.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {appointment.client.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {appointment.client}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {appointment.service} • {appointment.staff}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-sm text-gray-500">
                          {appointment.time}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`badge ${
                            appointment.status === 'confirmed' ? 'badge-success' :
                            appointment.status === 'in_progress' ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {appointment.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
