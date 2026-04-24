import React from 'react'
import { X, Mail, MessageSquare, Bell, Clock, CheckCircle, XCircle, User, Edit, Trash2 } from 'lucide-react'

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

interface NotificationDetailModalProps {
  notification: NotificationLog
  onClose: () => void
  onEdit?: (notification: NotificationLog) => void
  onDelete?: (notification: NotificationLog) => void
}

export default function NotificationDetailModal({ notification, onClose, onEdit, onDelete }: NotificationDetailModalProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      bounced: 'bg-orange-100 text-orange-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-green-500" />
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {getChannelIcon(notification.channel)}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {notification.type.replace(/_/g, ' ')}
              </h2>
              <p className="text-sm text-gray-500 capitalize">via {notification.channel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Status</span>
            <div className="flex items-center space-x-2">
              {getStatusIcon(notification.status)}
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(notification.status)}`}>
                {notification.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recipient</h3>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {notification.first_name?.[0] || '?'}{notification.last_name?.[0] || ''}
                </span>
              </div>
              <div>
                {notification.first_name && (
                  <p className="font-medium text-gray-900">
                    {notification.first_name} {notification.last_name}
                  </p>
                )}
                <p className="text-sm text-gray-500">{notification.recipient}</p>
              </div>
            </div>
          </div>

          {/* Subject */}
          {notification.subject && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Subject</h3>
              <p className="text-gray-900 font-medium">{notification.subject}</p>
            </div>
          )}

          {/* Message Body */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Message</h3>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{notification.body}</p>
          </div>

          {/* Timestamps */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Created: {formatDate(notification.created_at)}</span>
            </div>
            {notification.sent_at && (
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4" />
                <span>Sent: {formatDate(notification.sent_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit?.(notification)}
              className="btn bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete?.(notification)}
              className="btn bg-red-100 hover:bg-red-200 text-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
