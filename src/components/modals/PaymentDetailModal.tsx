import React from 'react'
import { X, CreditCard, DollarSign, User, Calendar, Clock, FileText, RefreshCw, Edit, Trash2 } from 'lucide-react'

interface Payment {
  id: string
  appointment_id: string
  client_id: string
  first_name: string
  last_name: string
  email: string
  amount: number
  tip: number
  total: number
  method: string
  status: string
  card_brand?: string
  card_last4?: string
  service_name?: string
  appointment_time?: string
  created_at: string
}

interface PaymentDetailModalProps {
  payment: Payment
  onClose: () => void
  onRefund?: (payment: Payment) => void
  onEdit?: (payment: Payment) => void
  onDelete?: (payment: Payment) => void
}

export default function PaymentDetailModal({ payment, onClose, onRefund, onEdit, onDelete }: PaymentDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      partially_refunded: 'bg-orange-100 text-orange-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
            <p className="text-sm text-gray-500">Transaction #{payment.id.toString().slice(0, 8)}</p>
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
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(payment.status)}`}>
              {payment.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Client Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Client</h3>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
              <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {payment.first_name?.[0]}{payment.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{payment.first_name} {payment.last_name}</p>
                <p className="text-sm text-gray-500">{payment.email}</p>
              </div>
            </div>
          </div>

          {/* Service Info */}
          {payment.service_name && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Service</h3>
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">{payment.service_name}</span>
              </div>
              {payment.appointment_time && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{formatDate(payment.appointment_time)}</span>
                </div>
              )}
            </div>
          )}

          {/* Payment Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payment Breakdown</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
              {payment.tip > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tip</span>
                  <span className="font-medium text-green-600">+{formatCurrency(payment.tip)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(payment.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payment Method</h3>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
              <CreditCard className="h-6 w-6 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 capitalize">{payment.method}</p>
                {payment.card_last4 && (
                  <p className="text-sm text-gray-500">
                    {payment.card_brand} ending in {payment.card_last4}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Processed on {formatDate(payment.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit?.(payment)}
              className="btn bg-blue-100 hover:bg-blue-200 text-blue-700 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete?.(payment)}
              className="btn bg-red-100 hover:bg-red-200 text-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Close
            </button>
            {payment.status === 'completed' && (
              <button
                onClick={() => onRefund?.(payment)}
                className="btn bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refund</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
