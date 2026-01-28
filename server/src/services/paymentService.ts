import { query } from '../config/database.js'

// Payment Service - Handles Stripe payments
export class PaymentService {
  private stripeClient: any = null

  async initialize(businessId: string) {
    try {
      const result = await query(
        'SELECT stripe_account_id, stripe_publishable_key FROM businesses WHERE id = $1',
        [businessId]
      )
      if (result.rows[0]?.stripe_account_id) {
        // In production, initialize Stripe with actual keys
        this.stripeClient = { accountId: result.rows[0].stripe_account_id }
      }
    } catch (error) {
      console.error('Failed to initialize payment service:', error)
    }
  }

  async createPaymentIntent(
    businessId: string,
    amount: number,
    currency: string = 'usd',
    customerId?: string,
    metadata?: any
  ): Promise<{ success: boolean; clientSecret?: string; paymentIntentId?: string; error?: string }> {
    try {
      // In production, would use actual Stripe API
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`

      console.log(`Created payment intent: ${paymentIntentId} for $${amount / 100}`)

      return {
        success: true,
        clientSecret,
        paymentIntentId
      }
    } catch (error: any) {
      console.error('Payment intent creation error:', error)
      return { success: false, error: error.message }
    }
  }

  async processPayment(
    businessId: string,
    appointmentId: string,
    amount: number,
    tip: number = 0,
    method: string = 'card',
    paymentIntentId?: string
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const total = amount + tip
      const chargeId = `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Get appointment and client info
      const aptResult = await query(
        'SELECT client_id FROM appointments WHERE id = $1',
        [appointmentId]
      )
      const clientId = aptResult.rows[0]?.client_id

      // Create payment record
      const result = await query(
        `INSERT INTO payments (
          business_id, appointment_id, client_id, amount, tip, total, method, status,
          stripe_payment_intent_id, stripe_charge_id, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9, NOW())
        RETURNING id`,
        [businessId, appointmentId, clientId, amount, tip, total, method, paymentIntentId, chargeId]
      )

      // Update appointment payment status
      await query(
        `UPDATE appointments SET payment_status = 'paid' WHERE id = $1`,
        [appointmentId]
      )

      // Update client total spent
      if (clientId) {
        await query(
          `UPDATE clients SET total_spent = total_spent + $1, last_visit = NOW() WHERE id = $2`,
          [total, clientId]
        )
      }

      return { success: true, paymentId: result.rows[0].id }
    } catch (error: any) {
      console.error('Payment processing error:', error)
      return { success: false, error: error.message }
    }
  }

  async processDeposit(
    businessId: string,
    appointmentId: string,
    amount: number
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO payments (
          business_id, appointment_id, amount, total, method, status, processed_at
        ) VALUES ($1, $2, $3, $3, 'card', 'completed', NOW())
        RETURNING id`,
        [businessId, appointmentId, amount]
      )

      await query(
        `UPDATE appointments SET deposit_paid = true, payment_status = 'deposit_paid' WHERE id = $1`,
        [appointmentId]
      )

      return { success: true, paymentId: result.rows[0].id }
    } catch (error: any) {
      console.error('Deposit processing error:', error)
      return { success: false, error: error.message }
    }
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const paymentResult = await query('SELECT * FROM payments WHERE id = $1', [paymentId])
      if (!paymentResult.rows[0]) {
        return { success: false, error: 'Payment not found' }
      }

      const payment = paymentResult.rows[0]
      const refundAmount = amount || payment.total
      const refundId = `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newStatus = refundAmount >= payment.total ? 'refunded' : 'partially_refunded'

      await query(
        `UPDATE payments SET status = $1, refund_amount = $2, refund_reason = $3, stripe_refund_id = $4, updated_at = NOW()
         WHERE id = $5`,
        [newStatus, refundAmount, reason, refundId, paymentId]
      )

      // Update appointment if exists
      if (payment.appointment_id) {
        await query(
          `UPDATE appointments SET payment_status = 'refunded' WHERE id = $1`,
          [payment.appointment_id]
        )
      }

      // Update client total spent
      if (payment.client_id) {
        await query(
          `UPDATE clients SET total_spent = total_spent - $1 WHERE id = $2`,
          [refundAmount, payment.client_id]
        )
      }

      return { success: true, refundId }
    } catch (error: any) {
      console.error('Refund error:', error)
      return { success: false, error: error.message }
    }
  }

  async getPaymentHistory(
    businessId: string,
    filters: {
      startDate?: string
      endDate?: string
      clientId?: string
      status?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<any[]> {
    try {
      let queryStr = `
        SELECT p.*, c.first_name, c.last_name, c.email,
               a.start_time as appointment_time, a.client_id,
               s.name as service_name
        FROM payments p
        JOIN appointments a ON p.appointment_id = a.id
        LEFT JOIN clients c ON a.client_id = c.id
        LEFT JOIN services s ON a.service_id = s.id
        WHERE a.business_id = $1
      `
      const params: any[] = [businessId]
      let paramIndex = 2

      if (filters.startDate) {
        queryStr += ` AND p.created_at >= $${paramIndex++}`
        params.push(filters.startDate)
      }
      if (filters.endDate) {
        queryStr += ` AND p.created_at <= $${paramIndex++}`
        params.push(filters.endDate)
      }
      if (filters.clientId) {
        queryStr += ` AND a.client_id = $${paramIndex++}`
        params.push(filters.clientId)
      }
      if (filters.status) {
        queryStr += ` AND p.status = $${paramIndex++}`
        params.push(filters.status)
      }

      queryStr += ` ORDER BY p.created_at DESC`

      if (filters.limit) {
        queryStr += ` LIMIT $${paramIndex++}`
        params.push(filters.limit)
      }
      if (filters.offset) {
        queryStr += ` OFFSET $${paramIndex++}`
        params.push(filters.offset)
      }

      const result = await query(queryStr, params)
      return result.rows
    } catch (error) {
      console.error('Get payment history error:', error)
      return []
    }
  }

  async getPaymentStats(businessId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const periodMap = {
        day: "NOW() - INTERVAL '1 day'",
        week: "NOW() - INTERVAL '7 days'",
        month: "NOW() - INTERVAL '30 days'",
        year: "NOW() - INTERVAL '365 days'"
      }

      const result = await query(
        `SELECT
          COUNT(*) as total_transactions,
          SUM(amount) as total_revenue,
          SUM(tip) as total_tips,
          AVG(total) as average_transaction,
          SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END) as total_refunds
        FROM payments
        WHERE business_id = $1 AND created_at >= ${periodMap[period]}`,
        [businessId]
      )

      return result.rows[0]
    } catch (error) {
      console.error('Get payment stats error:', error)
      return null
    }
  }

  async savePaymentMethod(
    clientId: string,
    stripePaymentMethodId: string,
    cardDetails: { brand: string; last4: string; expMonth: number; expYear: number }
  ): Promise<{ success: boolean; paymentMethodId?: string; error?: string }> {
    try {
      // Set all other methods as non-default
      await query(
        'UPDATE client_payment_methods SET is_default = false WHERE client_id = $1',
        [clientId]
      )

      const result = await query(
        `INSERT INTO client_payment_methods (
          client_id, stripe_payment_method_id, card_brand, card_last4, card_exp_month, card_exp_year, is_default
        ) VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id`,
        [clientId, stripePaymentMethodId, cardDetails.brand, cardDetails.last4, cardDetails.expMonth, cardDetails.expYear]
      )

      return { success: true, paymentMethodId: result.rows[0].id }
    } catch (error: any) {
      console.error('Save payment method error:', error)
      return { success: false, error: error.message }
    }
  }
}

export const paymentService = new PaymentService()
