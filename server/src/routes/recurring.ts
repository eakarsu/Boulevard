import { Router } from 'express'
import { recurringService } from '../services/recurringService.js'
import { query } from '../config/database.js'

const router = Router()

// Create recurring series
router.post('/series', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const {
      clientId, staffId, serviceId, pattern, dayOfWeek, dayOfMonth,
      intervalValue, preferredTime, startDate, endDate, maxOccurrences, notes
    } = req.body

    if (!clientId || !staffId || !serviceId || !pattern || !preferredTime || !startDate) {
      return res.status(400).json({
        error: 'Client ID, staff ID, service ID, pattern, preferred time, and start date are required'
      })
    }

    const result = await recurringService.createRecurringSeries(
      businessId, clientId, staffId, serviceId,
      { pattern, dayOfWeek, dayOfMonth, intervalValue, preferredTime, startDate, endDate, maxOccurrences, notes }
    )

    if (result.success) {
      res.json({
        data: { seriesId: result.seriesId, appointmentsCreated: result.appointmentsCreated },
        message: 'Recurring series created successfully'
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get recurring series by ID
router.get('/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params

    const result = await query(
      `SELECT rs.*, s.name as service_name, c.first_name, c.last_name, c.email,
              st.title as staff_title, u.first_name as staff_first_name, u.last_name as staff_last_name
       FROM recurring_series rs
       JOIN services s ON rs.service_id = s.id
       JOIN clients c ON rs.client_id = c.id
       JOIN staff st ON rs.staff_id = st.id
       JOIN users u ON st.user_id = u.id
       WHERE rs.id = $1`,
      [seriesId]
    )

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Recurring series not found' })
    }

    res.json({ data: result.rows[0] })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get all recurring series for business
router.get('/series', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { clientId, staffId, isActive } = req.query

    let queryStr = `
      SELECT rs.*, s.name as service_name, c.first_name, c.last_name,
             st.title as staff_title, u.first_name as staff_first_name, u.last_name as staff_last_name
       FROM recurring_series rs
       JOIN services s ON rs.service_id = s.id
       JOIN clients c ON rs.client_id = c.id
       JOIN staff st ON rs.staff_id = st.id
       JOIN users u ON st.user_id = u.id
       WHERE rs.business_id = $1
    `
    const params: any[] = [businessId]
    let paramIndex = 2

    if (clientId) {
      queryStr += ` AND rs.client_id = $${paramIndex++}`
      params.push(clientId)
    }
    if (staffId) {
      queryStr += ` AND rs.staff_id = $${paramIndex++}`
      params.push(staffId)
    }
    if (isActive !== undefined) {
      queryStr += ` AND rs.is_active = $${paramIndex++}`
      params.push(isActive === 'true')
    }

    queryStr += ' ORDER BY rs.created_at DESC'

    const result = await query(queryStr, params)
    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update recurring series
router.put('/series/:seriesId', async (req, res) => {
  try {
    const { seriesId } = req.params
    const { staffId, preferredTime, endDate, maxOccurrences, notes } = req.body

    const result = await recurringService.updateSeries(seriesId, {
      staffId, preferredTime, endDate, maxOccurrences, notes
    })

    if (result.success) {
      res.json({ message: 'Recurring series updated successfully' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Cancel recurring series
router.post('/series/:seriesId/cancel', async (req, res) => {
  try {
    const { seriesId } = req.params
    const { cancelFutureAppointments } = req.body

    const result = await recurringService.cancelSeries(seriesId, cancelFutureAppointments !== false)

    if (result.success) {
      res.json({ message: 'Recurring series cancelled successfully' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get appointments from a recurring series
router.get('/series/:seriesId/appointments', async (req, res) => {
  try {
    const { seriesId } = req.params
    const { upcoming } = req.query

    let queryStr = `
      SELECT a.*, c.first_name, c.last_name, s.name as service_name,
             st.title as staff_title, u.first_name as staff_first_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      JOIN staff st ON a.staff_id = st.id
      JOIN users u ON st.user_id = u.id
      WHERE a.recurring_series_id = $1
    `

    if (upcoming === 'true') {
      queryStr += ' AND a.start_time > NOW() AND a.status NOT IN (\'cancelled\', \'no_show\')'
    }

    queryStr += ' ORDER BY a.start_time ASC'

    const result = await query(queryStr, [seriesId])
    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Generate more appointments for a series
router.post('/series/:seriesId/generate', async (req, res) => {
  try {
    const { seriesId } = req.params
    const { count } = req.body

    const appointmentsCreated = await recurringService.generateAppointments(seriesId, count || 12)

    res.json({
      data: { appointmentsCreated },
      message: `${appointmentsCreated} appointments generated`
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get client's recurring series
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params
    const series = await recurringService.getClientRecurringSeries(clientId)
    res.json({ data: series })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Process recurring series (cron job endpoint)
router.post('/process', async (req, res) => {
  try {
    await recurringService.processRecurringSeries()
    res.json({ message: 'Recurring series processed' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
