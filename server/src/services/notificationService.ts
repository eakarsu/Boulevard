import { query } from '../config/database.js'

// Notification Service - Handles SMS and Email notifications
export class NotificationService {
  private twilioClient: any = null
  private sendgridClient: any = null

  async initialize(businessId: string) {
    try {
      const result = await query(
        'SELECT twilio_account_sid, twilio_auth_token, twilio_phone_number, sendgrid_api_key FROM businesses WHERE id = $1',
        [businessId]
      )
      if (result.rows[0]) {
        const { twilio_account_sid, twilio_auth_token, sendgrid_api_key } = result.rows[0]
        // Initialize Twilio if credentials exist
        if (twilio_account_sid && twilio_auth_token) {
          // In production, would initialize actual Twilio client
          this.twilioClient = { sid: twilio_account_sid }
        }
        if (sendgrid_api_key) {
          this.sendgridClient = { key: sendgrid_api_key }
        }
      }
    } catch (error) {
      console.error('Failed to initialize notification service:', error)
    }
  }

  async sendSMS(to: string, message: string, businessId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Log the notification
      const logResult = await query(
        `INSERT INTO notification_log (business_id, channel, recipient, body, status, sent_at)
         VALUES ($1, 'sms', $2, $3, 'sent', NOW())
         RETURNING id`,
        [businessId, to, message]
      )

      // In production, would use actual Twilio API
      console.log(`SMS to ${to}: ${message}`)

      return { success: true, messageId: logResult.rows[0]?.id }
    } catch (error: any) {
      console.error('SMS send error:', error)
      return { success: false, error: error.message }
    }
  }

  async sendEmail(to: string, subject: string, body: string, businessId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Log the notification
      const logResult = await query(
        `INSERT INTO notification_log (business_id, channel, recipient, subject, body, status, sent_at)
         VALUES ($1, 'email', $2, $3, $4, 'sent', NOW())
         RETURNING id`,
        [businessId, to, subject, body]
      )

      // In production, would use actual SendGrid API
      console.log(`Email to ${to}: ${subject}`)

      return { success: true, messageId: logResult.rows[0]?.id }
    } catch (error: any) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }
  }

  async sendAppointmentConfirmation(appointmentId: string): Promise<void> {
    try {
      const result = await query(
        `SELECT a.*, c.first_name, c.last_name, c.email, c.phone,
                s.name as service_name, st.title as staff_title,
                u.first_name as staff_first_name, u.last_name as staff_last_name,
                b.name as business_name, b.phone as business_phone
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         JOIN services s ON a.service_id = s.id
         JOIN staff st ON a.staff_id = st.id
         JOIN users u ON st.user_id = u.id
         JOIN businesses b ON a.business_id = b.id
         WHERE a.id = $1`,
        [appointmentId]
      )

      if (!result.rows[0]) return

      const apt = result.rows[0]
      const startTime = new Date(apt.start_time).toLocaleString()

      const message = `Hi ${apt.first_name}! Your appointment for ${apt.service_name} with ${apt.staff_first_name} at ${apt.business_name} is confirmed for ${startTime}. Reply STOP to unsubscribe.`

      // Send SMS if phone exists
      if (apt.phone) {
        await this.sendSMS(apt.phone, message, apt.business_id)
      }

      // Send email
      if (apt.email) {
        const emailBody = `
          <h2>Appointment Confirmed</h2>
          <p>Hi ${apt.first_name},</p>
          <p>Your appointment has been confirmed:</p>
          <ul>
            <li><strong>Service:</strong> ${apt.service_name}</li>
            <li><strong>With:</strong> ${apt.staff_first_name} ${apt.staff_last_name}</li>
            <li><strong>Date/Time:</strong> ${startTime}</li>
            <li><strong>Price:</strong> $${apt.price}</li>
          </ul>
          <p>If you need to reschedule or cancel, please contact us at ${apt.business_phone}.</p>
          <p>Thank you for choosing ${apt.business_name}!</p>
        `
        await this.sendEmail(apt.email, `Appointment Confirmed - ${apt.business_name}`, emailBody, apt.business_id)
      }

      // Update reminders_sent
      await query(
        `UPDATE appointments SET reminders_sent = array_append(reminders_sent, 'confirmation') WHERE id = $1`,
        [appointmentId]
      )
    } catch (error) {
      console.error('Failed to send appointment confirmation:', error)
    }
  }

  async sendAppointmentReminder(appointmentId: string, hoursBeforeType: string): Promise<void> {
    try {
      const result = await query(
        `SELECT a.*, c.first_name, c.last_name, c.email, c.phone,
                s.name as service_name, st.title as staff_title,
                u.first_name as staff_first_name,
                b.name as business_name, b.phone as business_phone
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         JOIN services s ON a.service_id = s.id
         JOIN staff st ON a.staff_id = st.id
         JOIN users u ON st.user_id = u.id
         JOIN businesses b ON a.business_id = b.id
         WHERE a.id = $1 AND a.status IN ('scheduled', 'confirmed')`,
        [appointmentId]
      )

      if (!result.rows[0]) return

      const apt = result.rows[0]
      const startTime = new Date(apt.start_time).toLocaleString()

      const message = `Reminder: You have an appointment for ${apt.service_name} at ${apt.business_name} on ${startTime}. See you soon!`

      if (apt.phone) {
        await this.sendSMS(apt.phone, message, apt.business_id)
      }

      if (apt.email) {
        await this.sendEmail(apt.email, `Appointment Reminder - ${apt.business_name}`, message, apt.business_id)
      }

      await query(
        `UPDATE appointments SET reminders_sent = array_append(reminders_sent, $2) WHERE id = $1`,
        [appointmentId, hoursBeforeType]
      )
    } catch (error) {
      console.error('Failed to send appointment reminder:', error)
    }
  }

  async sendCancellationNotification(appointmentId: string, reason?: string): Promise<void> {
    try {
      const result = await query(
        `SELECT a.*, c.first_name, c.email, c.phone,
                s.name as service_name, b.name as business_name, b.phone as business_phone
         FROM appointments a
         JOIN clients c ON a.client_id = c.id
         JOIN services s ON a.service_id = s.id
         JOIN businesses b ON a.business_id = b.id
         WHERE a.id = $1`,
        [appointmentId]
      )

      if (!result.rows[0]) return

      const apt = result.rows[0]
      const startTime = new Date(apt.start_time).toLocaleString()

      const message = `Your appointment for ${apt.service_name} on ${startTime} at ${apt.business_name} has been cancelled.${reason ? ` Reason: ${reason}` : ''} Contact us at ${apt.business_phone} to reschedule.`

      if (apt.phone) {
        await this.sendSMS(apt.phone, message, apt.business_id)
      }

      if (apt.email) {
        await this.sendEmail(apt.email, `Appointment Cancelled - ${apt.business_name}`, message, apt.business_id)
      }
    } catch (error) {
      console.error('Failed to send cancellation notification:', error)
    }
  }

  async scheduleReminders(appointmentId: string): Promise<void> {
    try {
      const result = await query(
        `SELECT a.start_time, a.business_id, bs.reminder_hours
         FROM appointments a
         JOIN business_settings bs ON a.business_id = bs.business_id
         WHERE a.id = $1`,
        [appointmentId]
      )

      if (!result.rows[0]) return

      const { start_time, reminder_hours } = result.rows[0]
      const appointmentTime = new Date(start_time)

      for (const hours of reminder_hours || [24, 2]) {
        const reminderTime = new Date(appointmentTime.getTime() - hours * 60 * 60 * 1000)

        if (reminderTime > new Date()) {
          await query(
            `INSERT INTO scheduled_notifications (appointment_id, type, channel, scheduled_for)
             VALUES ($1, $2, 'sms', $3), ($1, $2, 'email', $3)`,
            [appointmentId, `reminder_${hours}h`, reminderTime]
          )
        }
      }
    } catch (error) {
      console.error('Failed to schedule reminders:', error)
    }
  }

  async processScheduledNotifications(): Promise<void> {
    try {
      const result = await query(
        `SELECT sn.*, a.id as appointment_id
         FROM scheduled_notifications sn
         JOIN appointments a ON sn.appointment_id = a.id
         WHERE sn.sent = false
         AND sn.scheduled_for <= NOW()
         AND a.status IN ('scheduled', 'confirmed')
         LIMIT 100`
      )

      for (const notification of result.rows) {
        await this.sendAppointmentReminder(notification.appointment_id, notification.type)
        await query(
          `UPDATE scheduled_notifications SET sent = true, sent_at = NOW() WHERE id = $1`,
          [notification.id]
        )
      }
    } catch (error) {
      console.error('Failed to process scheduled notifications:', error)
    }
  }
}

export const notificationService = new NotificationService()
