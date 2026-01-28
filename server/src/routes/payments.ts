import { Router } from 'express'
import { paymentService } from '../services/paymentService.js'

const router = Router()

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency, customerId, metadata } = req.body
    const businessId = (req as any).user?.businessId || '1'

    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' })
    }

    const result = await paymentService.createPaymentIntent(
      businessId,
      amount,
      currency,
      customerId,
      metadata
    )

    if (result.success) {
      res.json({
        data: {
          clientSecret: result.clientSecret,
          paymentIntentId: result.paymentIntentId
        }
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Process payment for appointment
router.post('/process', async (req, res) => {
  try {
    const { appointmentId, amount, tip, method, paymentIntentId } = req.body
    const businessId = (req as any).user?.businessId || '1'

    if (!appointmentId || !amount) {
      return res.status(400).json({ error: 'Appointment ID and amount are required' })
    }

    const result = await paymentService.processPayment(
      businessId,
      appointmentId,
      amount,
      tip,
      method,
      paymentIntentId
    )

    if (result.success) {
      res.json({
        data: { paymentId: result.paymentId },
        message: 'Payment processed successfully'
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Process deposit
router.post('/deposit', async (req, res) => {
  try {
    const { appointmentId, amount } = req.body
    const businessId = (req as any).user?.businessId || '1'

    if (!appointmentId || !amount) {
      return res.status(400).json({ error: 'Appointment ID and amount are required' })
    }

    const result = await paymentService.processDeposit(businessId, appointmentId, amount)

    if (result.success) {
      res.json({
        data: { paymentId: result.paymentId },
        message: 'Deposit processed successfully'
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Refund payment
router.post('/:paymentId/refund', async (req, res) => {
  try {
    const { paymentId } = req.params
    const { amount, reason } = req.body

    const result = await paymentService.refundPayment(paymentId, amount, reason)

    if (result.success) {
      res.json({
        data: { refundId: result.refundId },
        message: 'Refund processed successfully'
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get payment history
router.get('/history', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { startDate, endDate, clientId, status, limit, offset } = req.query

    const payments = await paymentService.getPaymentHistory(businessId, {
      startDate: startDate as string,
      endDate: endDate as string,
      clientId: clientId as string,
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    })

    res.json({ data: payments })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get payment stats
router.get('/stats', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { period } = req.query

    const stats = await paymentService.getPaymentStats(
      businessId,
      (period as 'day' | 'week' | 'month' | 'year') || 'month'
    )

    res.json({ data: stats })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Save payment method for client
router.post('/methods', async (req, res) => {
  try {
    const { clientId, stripePaymentMethodId, cardBrand, cardLast4, cardExpMonth, cardExpYear } = req.body

    if (!clientId || !stripePaymentMethodId) {
      return res.status(400).json({ error: 'Client ID and payment method ID are required' })
    }

    const result = await paymentService.savePaymentMethod(clientId, stripePaymentMethodId, {
      brand: cardBrand,
      last4: cardLast4,
      expMonth: cardExpMonth,
      expYear: cardExpYear
    })

    if (result.success) {
      res.json({
        data: { paymentMethodId: result.paymentMethodId },
        message: 'Payment method saved successfully'
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
