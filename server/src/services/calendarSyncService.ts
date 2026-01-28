import { query } from '../config/database.js'

// Google Calendar Sync Service
export class CalendarSyncService {
  private googleClient: any = null

  // Initialize with OAuth credentials
  async initialize(accessToken: string, refreshToken: string) {
    // In production, would initialize Google Calendar API client
    this.googleClient = { accessToken, refreshToken }
  }

  // Create Google Calendar event from appointment
  async createCalendarEvent(appointmentId: string): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const result = await query(
        `SELECT a.*, c.first_name, c.last_name, c.email as client_email, c.phone as client_phone,
                s.name as service_name, st.google_calendar_id,
                u.first_name as staff_first_name, u.last_name as staff_last_name,
                b.name as business_name
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         JOIN services s ON a.service_id = s.id
         JOIN staff st ON a.staff_id = st.id
         JOIN users u ON st.user_id = u.id
         JOIN businesses b ON a.business_id = b.id
         WHERE a.id = $1`,
        [appointmentId]
      )

      if (!result.rows[0]) {
        return { success: false, error: 'Appointment not found' }
      }

      const apt = result.rows[0]

      // In production, would use Google Calendar API
      const eventId = `gcal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const event = {
        id: eventId,
        summary: `${apt.service_name} - ${apt.first_name} ${apt.last_name}`,
        description: `Service: ${apt.service_name}\nClient: ${apt.first_name} ${apt.last_name}\nPhone: ${apt.client_phone}\nEmail: ${apt.client_email}\n\nNotes: ${apt.notes || 'None'}`,
        start: {
          dateTime: apt.start_time,
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: apt.end_time,
          timeZone: 'America/New_York'
        },
        attendees: apt.client_email ? [{ email: apt.client_email }] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 15 }
          ]
        }
      }

      console.log('Would create Google Calendar event:', event)

      // Update appointment with event ID
      await query(
        'UPDATE appointments SET google_calendar_event_id = $1 WHERE id = $2',
        [eventId, appointmentId]
      )

      return { success: true, eventId }
    } catch (error: any) {
      console.error('Create calendar event error:', error)
      return { success: false, error: error.message }
    }
  }

  // Update Google Calendar event
  async updateCalendarEvent(appointmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await query(
        `SELECT a.*, c.first_name, c.last_name, s.name as service_name
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         JOIN services s ON a.service_id = s.id
         WHERE a.id = $1`,
        [appointmentId]
      )

      if (!result.rows[0] || !result.rows[0].google_calendar_event_id) {
        return { success: false, error: 'Appointment or event not found' }
      }

      // In production, would use Google Calendar API to update
      console.log('Would update Google Calendar event:', result.rows[0].google_calendar_event_id)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Delete Google Calendar event
  async deleteCalendarEvent(appointmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await query(
        'SELECT google_calendar_event_id FROM appointments WHERE id = $1',
        [appointmentId]
      )

      if (!result.rows[0]?.google_calendar_event_id) {
        return { success: true } // No event to delete
      }

      // In production, would use Google Calendar API to delete
      console.log('Would delete Google Calendar event:', result.rows[0].google_calendar_event_id)

      await query(
        'UPDATE appointments SET google_calendar_event_id = NULL WHERE id = $1',
        [appointmentId]
      )

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Sync external calendar events (blocks time for staff)
  async syncExternalEvents(staffId: string): Promise<{ success: boolean; eventsImported?: number; error?: string }> {
    try {
      // Get staff's Google Calendar ID
      const staffResult = await query(
        'SELECT google_calendar_id FROM staff WHERE id = $1',
        [staffId]
      )

      if (!staffResult.rows[0]?.google_calendar_id) {
        return { success: false, error: 'Staff has no Google Calendar configured' }
      }

      // In production, would fetch events from Google Calendar API
      // For now, simulating some external events
      const externalEvents = [
        {
          id: `ext_${Date.now()}_1`,
          title: 'Personal Appointment',
          start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
        }
      ]

      let imported = 0
      for (const event of externalEvents) {
        try {
          await query(
            `INSERT INTO external_calendar_events (staff_id, google_event_id, title, start_time, end_time)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (staff_id, google_event_id) DO UPDATE SET
               title = EXCLUDED.title,
               start_time = EXCLUDED.start_time,
               end_time = EXCLUDED.end_time,
               updated_at = NOW()`,
            [staffId, event.id, event.title, event.start, event.end]
          )
          imported++
        } catch (err) {
          console.error('Failed to import event:', err)
        }
      }

      // Update sync status
      await query(
        `INSERT INTO calendar_sync_status (staff_id, google_calendar_id, last_synced_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (staff_id) DO UPDATE SET last_synced_at = NOW()`,
        [staffId, staffResult.rows[0].google_calendar_id]
      )

      return { success: true, eventsImported: imported }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Connect staff to Google Calendar
  async connectGoogleCalendar(staffId: string, authCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      // In production, would exchange auth code for tokens using Google OAuth
      const mockCalendarId = `calendar_${staffId}@group.calendar.google.com`

      await query(
        `UPDATE staff SET google_calendar_id = $1, google_calendar_synced = true WHERE id = $2`,
        [mockCalendarId, staffId]
      )

      // Create sync status entry
      await query(
        `INSERT INTO calendar_sync_status (staff_id, google_calendar_id, is_enabled)
         VALUES ($1, $2, true)
         ON CONFLICT (staff_id) DO UPDATE SET
           google_calendar_id = EXCLUDED.google_calendar_id,
           is_enabled = true`,
        [staffId, mockCalendarId]
      )

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Disconnect Google Calendar
  async disconnectGoogleCalendar(staffId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await query(
        'UPDATE staff SET google_calendar_id = NULL, google_calendar_synced = false WHERE id = $1',
        [staffId]
      )

      await query(
        'UPDATE calendar_sync_status SET is_enabled = false WHERE staff_id = $1',
        [staffId]
      )

      // Remove external events
      await query('DELETE FROM external_calendar_events WHERE staff_id = $1', [staffId])

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get sync status
  async getSyncStatus(staffId: string): Promise<any> {
    try {
      const result = await query(
        `SELECT css.*, s.google_calendar_id, s.google_calendar_synced
         FROM staff s
         LEFT JOIN calendar_sync_status css ON s.id = css.staff_id
         WHERE s.id = $1`,
        [staffId]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Get sync status error:', error)
      return null
    }
  }

  // Process all calendar syncs (cron job)
  async processCalendarSyncs(): Promise<void> {
    try {
      const result = await query(
        `SELECT staff_id FROM calendar_sync_status WHERE is_enabled = true`
      )

      for (const row of result.rows) {
        await this.syncExternalEvents(row.staff_id)
      }
    } catch (error) {
      console.error('Process calendar syncs error:', error)
    }
  }
}

export const calendarSyncService = new CalendarSyncService()
