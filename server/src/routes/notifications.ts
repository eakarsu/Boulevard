import { Router } from 'express'
import { notificationService } from '../services/notificationService.js'
import { query } from '../config/database.js'

const router = Router()

// Send test SMS
router.post('/test-sms', async (req, res) => {
  try {
    const { phone, message } = req.body
    const businessId = (req as any).user?.businessId || '1'

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' })
    }

    const result = await notificationService.sendSMS(phone, message, businessId)

    if (result.success) {
      res.json({ message: 'SMS sent successfully', messageId: result.messageId })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Send test email
router.post('/test-email', async (req, res) => {
  try {
    const { email, subject, body } = req.body
    const businessId = (req as any).user?.businessId || '1'

    if (!email || !subject || !body) {
      return res.status(400).json({ error: 'Email, subject, and body are required' })
    }

    const result = await notificationService.sendEmail(email, subject, body, businessId)

    if (result.success) {
      res.json({ message: 'Email sent successfully', messageId: result.messageId })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Send appointment confirmation
router.post('/send-confirmation/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params
    await notificationService.sendAppointmentConfirmation(appointmentId)
    res.json({ message: 'Confirmation sent successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Send appointment reminder
router.post('/send-reminder/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params
    const { type } = req.body

    await notificationService.sendAppointmentReminder(appointmentId, type || '24h')
    res.json({ message: 'Reminder sent successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get notification log
router.get('/log', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { startDate, endDate, channel, status, limit, offset } = req.query

    let queryStr = `
      SELECT nl.*, c.first_name, c.last_name
      FROM notification_log nl
      LEFT JOIN clients c ON nl.client_id = c.id
      WHERE nl.business_id = $1
    `
    const params: any[] = [businessId]
    let paramIndex = 2

    if (startDate) {
      queryStr += ` AND nl.created_at >= $${paramIndex++}`
      params.push(startDate)
    }
    if (endDate) {
      queryStr += ` AND nl.created_at <= $${paramIndex++}`
      params.push(endDate)
    }
    if (channel) {
      queryStr += ` AND nl.channel = $${paramIndex++}`
      params.push(channel)
    }
    if (status) {
      queryStr += ` AND nl.status = $${paramIndex++}`
      params.push(status)
    }

    queryStr += ' ORDER BY nl.created_at DESC'

    if (limit) {
      queryStr += ` LIMIT $${paramIndex++}`
      params.push(limit)
    }
    if (offset) {
      queryStr += ` OFFSET $${paramIndex++}`
      params.push(offset)
    }

    const result = await query(queryStr, params)
    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get notification templates
router.get('/templates', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'

    const result = await query(
      'SELECT * FROM notification_templates WHERE business_id = $1 ORDER BY type, channel',
      [businessId]
    )
    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Create or update notification template
router.post('/templates', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { type, channel, subject, body, isActive } = req.body

    if (!type || !channel || !body) {
      return res.status(400).json({ error: 'Type, channel, and body are required' })
    }

    const result = await query(
      `INSERT INTO notification_templates (business_id, type, channel, subject, body, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (business_id, type, channel) DO UPDATE SET
         subject = EXCLUDED.subject,
         body = EXCLUDED.body,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [businessId, type, channel, subject, body, isActive !== false]
    )

    res.json({ data: result.rows[0], message: 'Template saved successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete notification template
router.delete('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params
    await query('DELETE FROM notification_templates WHERE id = $1', [templateId])
    res.json({ message: 'Template deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get scheduled notifications
router.get('/scheduled', async (req, res) => {
  try {
    const result = await query(
      `SELECT sn.*, a.start_time, c.first_name, c.last_name, s.name as service_name
       FROM scheduled_notifications sn
       JOIN appointments a ON sn.appointment_id = a.id
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       WHERE sn.sent = false AND sn.scheduled_for > NOW()
       ORDER BY sn.scheduled_for ASC
       LIMIT 100`
    )
    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Process pending notifications (would be called by cron)
router.post('/process-scheduled', async (req, res) => {
  try {
    await notificationService.processScheduledNotifications()
    res.json({ message: 'Scheduled notifications processed' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
