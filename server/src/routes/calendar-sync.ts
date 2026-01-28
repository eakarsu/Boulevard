import { Router } from 'express'
import { calendarSyncService } from '../services/calendarSyncService.js'
import { query } from '../config/database.js'

const router = Router()

// Connect staff to Google Calendar
router.post('/staff/:staffId/connect', async (req, res) => {
  try {
    const { staffId } = req.params
    const { authCode } = req.body

    if (!authCode) {
      return res.status(400).json({ error: 'Auth code is required' })
    }

    const result = await calendarSyncService.connectGoogleCalendar(staffId, authCode)

    if (result.success) {
      res.json({ message: 'Google Calendar connected successfully' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Disconnect Google Calendar
router.post('/staff/:staffId/disconnect', async (req, res) => {
  try {
    const { staffId } = req.params

    const result = await calendarSyncService.disconnectGoogleCalendar(staffId)

    if (result.success) {
      res.json({ message: 'Google Calendar disconnected successfully' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get sync status
router.get('/staff/:staffId/status', async (req, res) => {
  try {
    const { staffId } = req.params
    const status = await calendarSyncService.getSyncStatus(staffId)
    res.json({ data: status })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Manually sync external events
router.post('/staff/:staffId/sync', async (req, res) => {
  try {
    const { staffId } = req.params

    const result = await calendarSyncService.syncExternalEvents(staffId)

    if (result.success) {
      res.json({
        message: 'Calendar synced successfully',
        eventsImported: result.eventsImported
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Create calendar event from appointment
router.post('/appointments/:appointmentId/sync', async (req, res) => {
  try {
    const { appointmentId } = req.params

    const result = await calendarSyncService.createCalendarEvent(appointmentId)

    if (result.success) {
      res.json({
        message: 'Calendar event created',
        eventId: result.eventId
      })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update calendar event
router.put('/appointments/:appointmentId/sync', async (req, res) => {
  try {
    const { appointmentId } = req.params

    const result = await calendarSyncService.updateCalendarEvent(appointmentId)

    if (result.success) {
      res.json({ message: 'Calendar event updated' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete calendar event
router.delete('/appointments/:appointmentId/sync', async (req, res) => {
  try {
    const { appointmentId } = req.params

    const result = await calendarSyncService.deleteCalendarEvent(appointmentId)

    if (result.success) {
      res.json({ message: 'Calendar event deleted' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get external calendar events for staff
router.get('/staff/:staffId/external-events', async (req, res) => {
  try {
    const { staffId } = req.params
    const { startDate, endDate } = req.query

    let queryStr = `
      SELECT * FROM external_calendar_events
      WHERE staff_id = $1
    `
    const params: any[] = [staffId]
    let paramIndex = 2

    if (startDate) {
      queryStr += ` AND start_time >= $${paramIndex++}`
      params.push(startDate)
    }
    if (endDate) {
      queryStr += ` AND end_time <= $${paramIndex++}`
      params.push(endDate)
    }

    queryStr += ' ORDER BY start_time ASC'

    const result = await query(queryStr, params)
    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get Google Calendar OAuth URL
router.get('/oauth-url', (req, res) => {
  // In production, would generate actual Google OAuth URL
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent('http://localhost:8000/api/calendar-sync/callback')}&response_type=code&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar')}&access_type=offline`

  res.json({ data: { url: oauthUrl } })
})

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code, state } = req.query

    // In production, would exchange code for tokens
    console.log('OAuth callback received with code:', code)

    // Redirect back to frontend
    res.redirect(`http://localhost:5173/settings?calendar_connected=true`)
  } catch (error: any) {
    res.redirect(`http://localhost:5173/settings?calendar_error=${encodeURIComponent(error.message)}`)
  }
})

// Process all calendar syncs (cron job)
router.post('/process-syncs', async (req, res) => {
  try {
    await calendarSyncService.processCalendarSyncs()
    res.json({ message: 'Calendar syncs processed' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
