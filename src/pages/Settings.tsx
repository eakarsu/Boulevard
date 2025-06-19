import React, { useState } from 'react'
import { 
  Building, 
  Users, 
  Bell, 
  CreditCard, 
  Shield, 
  Globe, 
  Clock, 
  Mail,
  Phone,
  MapPin,
  Save,
  Camera,
  DollarSign
} from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('business')
  const [businessSettings, setBusinessSettings] = useState({
    name: 'Boulevard Salon & Spa',
    email: 'info@boulevardsalon.com',
    phone: '+1 (555) 123-4567',
    website: 'https://boulevardsalon.com',
    address: {
      street: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'United States'
    },
    timezone: 'America/New_York',
    currency: 'USD',
    bookingWindow: 30,
    cancellationPolicy: '24 hours notice required',
    noShowPolicy: 'Charge 50% of service cost',
    requireDeposit: true,
    depositAmount: 25,
    allowOnlineBooking: true,
    autoConfirmBookings: false,
    sendReminders: true,
    reminderTimes: [24, 2]
  })

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    push: true,
    types: {
      bookingConfirmation: true,
      reminders: true,
      cancellations: true,
      promotions: false
    }
  })

  const tabs = [
    { id: 'business', name: 'Business Info', icon: Building },
    { id: 'booking', name: 'Booking Settings', icon: Clock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'staff', name: 'Staff & Permissions', icon: Users },
    { id: 'security', name: 'Security', icon: Shield },
  ]

  const handleBusinessChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setBusinessSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setBusinessSettings(prev => ({ ...prev, [field]: value }))
    }
  }

  const renderBusinessInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              className="input"
              value={businessSettings.name}
              onChange={(e) => handleBusinessChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="input"
              value={businessSettings.email}
              onChange={(e) => handleBusinessChange('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              className="input"
              value={businessSettings.phone}
              onChange={(e) => handleBusinessChange('phone', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              className="input"
              value={businessSettings.website}
              onChange={(e) => handleBusinessChange('website', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              className="input"
              value={businessSettings.address.street}
              onChange={(e) => handleBusinessChange('address.street', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              className="input"
              value={businessSettings.address.city}
              onChange={(e) => handleBusinessChange('address.city', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              className="input"
              value={businessSettings.address.state}
              onChange={(e) => handleBusinessChange('address.state', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              className="input"
              value={businessSettings.address.zipCode}
              onChange={(e) => handleBusinessChange('address.zipCode', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              className="input"
              value={businessSettings.address.country}
              onChange={(e) => handleBusinessChange('address.country', e.target.value)}
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBookingSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Configuration</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              className="input"
              value={businessSettings.timezone}
              onChange={(e) => handleBusinessChange('timezone', e.target.value)}
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              className="input"
              value={businessSettings.currency}
              onChange={(e) => handleBusinessChange('currency', e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="CAD">CAD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Window (days in advance)
            </label>
            <input
              type="number"
              className="input"
              value={businessSettings.bookingWindow}
              onChange={(e) => handleBusinessChange('bookingWindow', parseInt(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount ($)
            </label>
            <input
              type="number"
              className="input"
              value={businessSettings.depositAmount}
              onChange={(e) => handleBusinessChange('depositAmount', parseInt(e.target.value))}
              disabled={!businessSettings.requireDeposit}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Policies</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Policy
            </label>
            <textarea
              className="input"
              rows={3}
              value={businessSettings.cancellationPolicy}
              onChange={(e) => handleBusinessChange('cancellationPolicy', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No-Show Policy
            </label>
            <textarea
              className="input"
              rows={3}
              value={businessSettings.noShowPolicy}
              onChange={(e) => handleBusinessChange('noShowPolicy', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Require Deposit</h4>
              <p className="text-sm text-gray-500">Require clients to pay a deposit when booking</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={businessSettings.requireDeposit}
              onChange={(e) => handleBusinessChange('requireDeposit', e.target.checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Allow Online Booking</h4>
              <p className="text-sm text-gray-500">Enable clients to book appointments online</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={businessSettings.allowOnlineBooking}
              onChange={(e) => handleBusinessChange('allowOnlineBooking', e.target.checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Auto-Confirm Bookings</h4>
              <p className="text-sm text-gray-500">Automatically confirm new bookings</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={businessSettings.autoConfirmBookings}
              onChange={(e) => handleBusinessChange('autoConfirmBookings', e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={notificationSettings.email}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, email: e.target.checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={notificationSettings.sms}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, sms: e.target.checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-500">Receive push notifications in browser</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={notificationSettings.push}
              onChange={(e) => setNotificationSettings(prev => ({ ...prev, push: e.target.checked }))}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
        <div className="space-y-4">
          {Object.entries(notificationSettings.types).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-gray-500">
                  {key === 'bookingConfirmation' && 'Notifications when bookings are confirmed'}
                  {key === 'reminders' && 'Appointment reminder notifications'}
                  {key === 'cancellations' && 'Notifications when appointments are cancelled'}
                  {key === 'promotions' && 'Marketing and promotional notifications'}
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={value}
                onChange={(e) => setNotificationSettings(prev => ({
                  ...prev,
                  types: { ...prev.types, [key]: e.target.checked }
                }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPayments = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Stripe</h4>
                <p className="text-sm text-gray-500">Credit cards, debit cards, digital wallets</p>
              </div>
            </div>
            <span className="badge-success">Connected</span>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Cash</h4>
                <p className="text-sm text-gray-500">Accept cash payments</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Processing</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Fee (%)
            </label>
            <input
              type="number"
              className="input"
              defaultValue="2.9"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fixed Fee ($)
            </label>
            <input
              type="number"
              className="input"
              defaultValue="0.30"
              step="0.01"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tip Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable Tips</h4>
              <p className="text-sm text-gray-500">Allow customers to add tips to payments</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Tip Percentages
            </label>
            <div className="flex space-x-2">
              <input type="number" className="input w-20" defaultValue="15" />
              <input type="number" className="input w-20" defaultValue="18" />
              <input type="number" className="input w-20" defaultValue="20" />
              <input type="number" className="input w-20" defaultValue="25" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Policy</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Window (days)
            </label>
            <input
              type="number"
              className="input"
              defaultValue="7"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Auto-approve Refunds</h4>
              <p className="text-sm text-gray-500">Automatically approve refunds within policy</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStaff = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Staff Roles & Permissions</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Owner</h4>
              <span className="badge bg-purple-100 text-purple-800">Full Access</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">Complete access to all features and settings</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-green-600">✓ Manage Staff</span>
              <span className="text-green-600">✓ Financial Reports</span>
              <span className="text-green-600">✓ Business Settings</span>
              <span className="text-green-600">✓ Payment Settings</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Manager</h4>
              <span className="badge bg-blue-100 text-blue-800">High Access</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">Manage daily operations and staff scheduling</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-green-600">✓ Schedule Management</span>
              <span className="text-green-600">✓ Client Management</span>
              <span className="text-green-600">✓ Service Management</span>
              <span className="text-red-600">✗ Financial Settings</span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Staff</h4>
              <span className="badge bg-green-100 text-green-800">Limited Access</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">Access to own schedule and client appointments</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-green-600">✓ Own Schedule</span>
              <span className="text-green-600">✓ Client Notes</span>
              <span className="text-red-600">✗ Staff Management</span>
              <span className="text-red-600">✗ Business Settings</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Automatic Commission Calculation</h4>
              <p className="text-sm text-gray-500">Calculate commissions automatically based on services</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Commission Rate (%)
              </label>
              <input
                type="number"
                className="input"
                defaultValue="40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commission on Tips (%)
              </label>
              <input
                type="number"
                className="input"
                defaultValue="100"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Time Tracking</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Clock In/Out Required</h4>
              <p className="text-sm text-gray-500">Require staff to clock in and out for shifts</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Break Tracking</h4>
              <p className="text-sm text-gray-500">Track break times for payroll</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Password Policy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Require Strong Passwords</h4>
              <p className="text-sm text-gray-500">Minimum 8 characters with numbers and symbols</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Expiry (days)
              </label>
              <input
                type="number"
                className="input"
                defaultValue="90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Attempts Before Lockout
              </label>
              <input
                type="number"
                className="input"
                defaultValue="5"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable 2FA</h4>
              <p className="text-sm text-gray-500">Require two-factor authentication for all users</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">SMS Authentication</h4>
              <p className="text-sm text-gray-500">Send verification codes via SMS</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Authentication</h4>
              <p className="text-sm text-gray-500">Send verification codes via email</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Session Management</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                className="input"
                defaultValue="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remember Me Duration (days)
              </label>
              <input
                type="number"
                className="input"
                defaultValue="30"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Force Logout on Multiple Devices</h4>
              <p className="text-sm text-gray-500">Automatically log out when signing in from new device</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Protection</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Data Encryption</h4>
              <p className="text-sm text-gray-500">Encrypt sensitive data at rest and in transit</p>
            </div>
            <span className="badge-success">Enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Audit Logging</h4>
              <p className="text-sm text-gray-500">Log all user actions for security monitoring</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Automatic Backups</h4>
              <p className="text-sm text-gray-500">Daily encrypted backups of all data</p>
            </div>
            <span className="badge-success">Active</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">IP Restrictions</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Enable IP Whitelist</h4>
              <p className="text-sm text-gray-500">Only allow access from specific IP addresses</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed IP Addresses
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="192.168.1.1&#10;10.0.0.1&#10;203.0.113.1"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'business':
        return renderBusinessInfo()
      case 'booking':
        return renderBookingSettings()
      case 'notifications':
        return renderNotifications()
      case 'payments':
        return renderPayments()
      case 'staff':
        return renderStaff()
      case 'security':
        return renderSecurity()
      default:
        return null
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        
        <div className="mt-8 flex">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${
                      activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'
                    }`} />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 ml-8">
            <div className="card">
              <div className="card-body">
                {renderContent()}
                
                {(activeTab === 'business' || activeTab === 'booking' || activeTab === 'notifications' || activeTab === 'payments' || activeTab === 'staff' || activeTab === 'security') && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-end">
                      <button className="btn-primary">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
