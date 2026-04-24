import React, { useState, useEffect } from 'react'
import {
  DollarSign, CreditCard, RefreshCw, Download, Search,
  CheckCircle, XCircle, Clock, ArrowUpRight, Filter
} from 'lucide-react'
import { paymentsAPI } from '../services/api'
import { PaymentDetailModal } from '../components/modals'

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

interface PaymentStats {
  total_transactions: number
  total_revenue: number
  total_tips: number
  average_transaction: number
  total_refunds: number
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [detailPayment, setDetailPayment] = useState<Payment | null>(null)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Payment | null>(null)

  useEffect(() => {
    fetchData()
  }, [period, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, statsRes] = await Promise.all([
        paymentsAPI.getPaymentHistory({ status: statusFilter || undefined, limit: 100 }),
        paymentsAPI.getPaymentStats(period)
      ])
      setPayments(paymentsRes.data?.data || [])
      setStats(statsRes.data?.data || null)
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedPayment) return

    try {
      await paymentsAPI.refundPayment(
        selectedPayment.id,
        refundAmount ? parseFloat(refundAmount) : undefined,
        refundReason
      )
      setShowRefundModal(false)
      setSelectedPayment(null)
      setRefundAmount('')
      setRefundReason('')
      fetchData()
    } catch (error) {
      console.error('Refund failed:', error)
    }
  }

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

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />
      case 'cash': return <DollarSign className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      payment.first_name?.toLowerCase().includes(search) ||
      payment.last_name?.toLowerCase().includes(search) ||
      payment.email?.toLowerCase().includes(search) ||
      payment.service_name?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
            <p className="text-gray-500 mt-1">Manage payments, refunds, and transaction history</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="rounded-lg border-gray-300 shadow-sm"
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total_revenue)}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_transactions}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tips</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.total_tips)}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <ArrowUpRight className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Transaction</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.average_transaction)}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Refunds</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(stats.total_refunds)}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-full">
                  <RefreshCw className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by client name, email, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border-gray-300 shadow-sm"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setDetailPayment(payment)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.first_name} {payment.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{payment.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.service_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {payment.tip > 0 ? formatCurrency(payment.tip) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          {getMethodIcon(payment.method)}
                          <span className="ml-2 capitalize">{payment.method}</span>
                          {payment.card_last4 && (
                            <span className="ml-1 text-gray-500">****{payment.card_last4}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(payment.status)}`}>
                          {payment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                        {payment.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedPayment(payment)
                              setShowRefundModal(true)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Detail Modal */}
      {detailPayment && (
        <PaymentDetailModal
          payment={detailPayment}
          onClose={() => setDetailPayment(null)}
          onRefund={(payment) => {
            setDetailPayment(null)
            setSelectedPayment(payment)
            setShowRefundModal(true)
          }}
          onEdit={(payment) => {
            setDetailPayment(null)
            setEditingPayment(payment)
          }}
          onDelete={(payment) => {
            setDetailPayment(null)
            setDeleteConfirm(payment)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Payment</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this payment of <strong>{formatCurrency(deleteConfirm.total)}</strong> for{' '}
              <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => {
                  // In a real app, call API to delete payment
                  console.log('Delete payment:', deleteConfirm.id)
                  setDeleteConfirm(null)
                  fetchData()
                }}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Edit Payment</h2>
              <button onClick={() => setEditingPayment(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                console.log('Update payment:', {
                  id: editingPayment.id,
                  amount: formData.get('amount'),
                  tip: formData.get('tip'),
                  method: formData.get('method'),
                  status: formData.get('status')
                })
                setEditingPayment(null)
                fetchData()
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    defaultValue={editingPayment.amount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tip ($)</label>
                  <input
                    type="number"
                    name="tip"
                    step="0.01"
                    defaultValue={editingPayment.tip}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select
                    name="method"
                    defaultValue={editingPayment.method}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="gift_card">Gift Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    defaultValue={editingPayment.status}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <input
                  type="text"
                  disabled
                  value={`${editingPayment.first_name} ${editingPayment.last_name}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingPayment(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Process Refund</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Original Amount</p>
                <p className="text-lg font-medium">{formatCurrency(selectedPayment.total)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount (leave blank for full refund)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={selectedPayment.total.toString()}
                  max={selectedPayment.total}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRefundModal(false)
                    setSelectedPayment(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  className="btn btn-primary bg-red-600 hover:bg-red-700"
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
