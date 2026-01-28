import React, { useState, useEffect } from 'react'
import {
  Bell, Mail, MessageSquare, Send, Settings, Clock,
  CheckCircle, XCircle, AlertCircle, Plus, Trash2, Edit
} from 'lucide-react'
import { notificationsAPI } from '../services/api'

interface NotificationLog {
  id: string
  type: string
  channel: string
  recipient: string
  subject?: string
  body: string
  status: string
  first_name?: string
  last_name?: string
  created_at: string
  sent_at?: string
}

interface NotificationTemplate {
  id: string
  type: string
  channel: string
  subject?: string
  body: string
  is_active: boolean
}

export default function Notifications() {
  const [activeTab, setActiveTab] = useState<'log' | 'templates' | 'settings'>('log')
  const [notificationLog, setNotificationLog] = useState<NotificationLog[]>([])
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    type: 'appointment_confirmation',
    channel: 'email',
    subject: '',
    body: '',
    isActive: true
  })

  // Test notification state
  const [testForm, setTestForm] = useState({
    channel: 'email',
    recipient: '',
    subject: 'Test Notification',
    body: 'This is a test notification from Boulevard.'
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'log') {
        const res = await notificationsAPI.getNotificationLog({ limit: 100 })
        setNotificationLog(res.data?.data || [])
      } else if (activeTab === 'templates') {
        const res = await notificationsAPI.getTemplates()
        setTemplates(res.data?.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      await notificationsAPI.saveTemplate(templateForm)
      setShowTemplateModal(false)
      setEditingTemplate(null)
      setTemplateForm({
        type: 'appointment_confirmation',
        channel: 'email',
        subject: '',
        body: '',
        isActive: true
      })
      fetchData()
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    try {
      await notificationsAPI.deleteTemplate(templateId)
      fetchData()
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  const handleSendTest = async () => {
    try {
      if (testForm.channel === 'sms') {
        await notificationsAPI.sendTestSMS(testForm.recipient, testForm.body)
      } else {
        await notificationsAPI.sendTestEmail(testForm.recipient, testForm.subject, testForm.body)
      }
      setShowTestModal(false)
      alert('Test notification sent successfully!')
    } catch (error) {
      console.error('Failed to send test:', error)
      alert('Failed to send test notification')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const notificationTypes = [
    { value: 'appointment_confirmation', label: 'Appointment Confirmation' },
    { value: 'appointment_reminder', label: 'Appointment Reminder' },
    { value: 'appointment_cancellation', label: 'Cancellation Notice' },
    { value: 'appointment_rescheduled', label: 'Rescheduled Notice' },
    { value: 'no_show', label: 'No Show Notice' },
    { value: 'review_request', label: 'Review Request' },
    { value: 'custom', label: 'Custom' }
  ]

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">Manage SMS and email notifications</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowTestModal(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Send Test</span>
            </button>
            {activeTab === 'templates' && (
              <button
                onClick={() => {
                  setEditingTemplate(null)
                  setTemplateForm({
                    type: 'appointment_confirmation',
                    channel: 'email',
                    subject: '',
                    body: '',
                    isActive: true
                  })
                  setShowTemplateModal(true)
                }}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>New Template</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'log', label: 'Notification Log', icon: Bell },
              { id: 'templates', label: 'Templates', icon: Mail },
              { id: 'settings', label: 'Settings', icon: Settings }
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

        {/* Notification Log */}
        {activeTab === 'log' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : notificationLog.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No notifications sent yet
                      </td>
                    </tr>
                  ) : (
                    notificationLog.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {log.first_name && (
                              <div className="text-sm font-medium text-gray-900">
                                {log.first_name} {log.last_name}
                              </div>
                            )}
                            <div className="text-sm text-gray-500">{log.recipient}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 capitalize">
                            {log.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            {getChannelIcon(log.channel)}
                            <span className="ml-2 capitalize">{log.channel}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(log.status)}
                            <span className="ml-2 text-sm capitalize">{log.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.sent_at ? formatDate(log.sent_at) : formatDate(log.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Templates */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No templates created yet. Click "New Template" to create one.
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(template.channel)}
                      <span className="font-medium text-gray-900 capitalize">
                        {template.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  {template.subject && (
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Subject: {template.subject}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                    {template.body}
                  </p>
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingTemplate(template)
                        setTemplateForm({
                          type: template.type,
                          channel: template.channel,
                          subject: template.subject || '',
                          body: template.body,
                          isActive: template.is_active
                        })
                        setShowTemplateModal(true)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Send appointment confirmations and reminders via email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-primary-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Send appointment confirmations and reminders via SMS</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-primary-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Reminder Times</p>
                    <p className="text-sm text-gray-500">Hours before appointment to send reminders</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="number" defaultValue={24} className="w-16 rounded border-gray-300" />
                    <span className="text-gray-500">and</span>
                    <input type="number" defaultValue={2} className="w-16 rounded border-gray-300" />
                    <span className="text-gray-500">hours</span>
                  </div>
                </div>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twilio Account SID</label>
                  <input type="password" placeholder="AC..." className="w-full rounded border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twilio Auth Token</label>
                  <input type="password" placeholder="..." className="w-full rounded border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twilio Phone Number</label>
                  <input type="text" placeholder="+1..." className="w-full rounded border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SendGrid API Key</label>
                  <input type="password" placeholder="SG..." className="w-full rounded border-gray-300" />
                </div>
              </div>
              <div className="mt-4">
                <button className="btn btn-primary">Save Settings</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                    className="w-full rounded border-gray-300"
                  >
                    {notificationTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                    className="w-full rounded border-gray-300"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>
              {templateForm.channel === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full rounded border-gray-300"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  rows={6}
                  className="w-full rounded border-gray-300"
                  placeholder="Use {{client_name}}, {{service_name}}, {{appointment_time}}, {{business_name}} as placeholders"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={templateForm.isActive}
                  onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                  className="rounded text-primary-600"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    setEditingTemplate(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleSaveTemplate} className="btn btn-primary">
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Notification Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Test Notification</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select
                  value={testForm.channel}
                  onChange={(e) => setTestForm({ ...testForm, channel: e.target.value })}
                  className="w-full rounded border-gray-300"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {testForm.channel === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={testForm.channel === 'email' ? 'email' : 'tel'}
                  value={testForm.recipient}
                  onChange={(e) => setTestForm({ ...testForm, recipient: e.target.value })}
                  className="w-full rounded border-gray-300"
                  placeholder={testForm.channel === 'email' ? 'test@example.com' : '+1234567890'}
                />
              </div>
              {testForm.channel === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={testForm.subject}
                    onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                    className="w-full rounded border-gray-300"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={testForm.body}
                  onChange={(e) => setTestForm({ ...testForm, body: e.target.value })}
                  rows={4}
                  className="w-full rounded border-gray-300"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTestModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleSendTest} className="btn btn-primary">
                  Send Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
