import { Router } from 'express'
import { analyticsService } from '../services/analyticsService.js'

const router = Router()

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { period } = req.query

    const stats = await analyticsService.getDashboardStats(
      businessId,
      (period as 'day' | 'week' | 'month' | 'year') || 'month'
    )

    res.json({ data: stats })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get revenue analytics
router.get('/revenue', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { startDate, endDate, groupBy } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' })
    }

    const data = await analyticsService.getRevenueAnalytics(
      businessId,
      startDate as string,
      endDate as string,
      (groupBy as 'day' | 'week' | 'month') || 'day'
    )

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get staff performance
router.get('/staff-performance', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { startDate, endDate } = req.query

    // Default to last 30 days
    const end = endDate || new Date().toISOString()
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const data = await analyticsService.getStaffPerformance(
      businessId,
      start as string,
      end as string
    )

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get service performance
router.get('/service-performance', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { startDate, endDate } = req.query

    const end = endDate || new Date().toISOString()
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const data = await analyticsService.getServicePerformance(
      businessId,
      start as string,
      end as string
    )

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get client insights
router.get('/client-insights', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'

    const data = await analyticsService.getClientInsights(businessId)

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get appointment trends
router.get('/appointment-trends', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { startDate, endDate } = req.query

    const end = endDate || new Date().toISOString()
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const data = await analyticsService.getAppointmentTrends(
      businessId,
      start as string,
      end as string
    )

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get historical metrics
router.get('/historical', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' })
    }

    const data = await analyticsService.getHistoricalMetrics(
      businessId,
      startDate as string,
      endDate as string
    )

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Generate daily metrics (cron job)
router.post('/generate-daily', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { date } = req.body

    const targetDate = date || new Date().toISOString().split('T')[0]
    await analyticsService.generateDailyMetrics(businessId, targetDate)

    res.json({ message: `Daily metrics generated for ${targetDate}` })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Export report (CSV/PDF)
router.get('/export', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { type, startDate, endDate, format } = req.query

    // In production, would generate actual CSV/PDF
    const data = {
      message: 'Report generated',
      type,
      period: { startDate, endDate },
      format: format || 'csv',
      downloadUrl: `/api/analytics/download/report-${Date.now()}.${format || 'csv'}`
    }

    res.json({ data })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
