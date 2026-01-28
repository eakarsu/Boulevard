import { query } from '../config/database.js'
import { schedulingService } from './schedulingService.js'
import { notificationService } from './notificationService.js'

// Recurring Appointment Service
export class RecurringService {

  // Create a recurring appointment series
  async createRecurringSeries(
    businessId: string,
    clientId: string,
    staffId: string,
    serviceId: string,
    params: {
      pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'
      dayOfWeek?: number
      dayOfMonth?: number
      intervalValue?: number
      preferredTime: string
      startDate: string
      endDate?: string
      maxOccurrences?: number
      notes?: string
    }
  ): Promise<{ success: boolean; seriesId?: string; appointmentsCreated?: number; error?: string }> {
    try {
      // Get service details
      const serviceResult = await query(
        'SELECT duration_minutes, price FROM services WHERE id = $1',
        [serviceId]
      )
      if (!serviceResult.rows[0]) {
        return { success: false, error: 'Service not found' }
      }
      const { duration_minutes, price } = serviceResult.rows[0]

      // Create the series
      const seriesResult = await query(
        `INSERT INTO recurring_series (
          business_id, client_id, staff_id, service_id,
          pattern, day_of_week, day_of_month, interval_value,
          preferred_time, duration_minutes, price, start_date, end_date, max_occurrences, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id`,
        [
          businessId, clientId, staffId, serviceId,
          params.pattern, params.dayOfWeek, params.dayOfMonth, params.intervalValue || 1,
          params.preferredTime, duration_minutes, price,
          params.startDate, params.endDate, params.maxOccurrences, params.notes
        ]
      )
      const seriesId = seriesResult.rows[0].id

      // Generate appointments
      const appointmentsCreated = await this.generateAppointments(seriesId, 12) // Generate up to 12 appointments

      return { success: true, seriesId, appointmentsCreated }
    } catch (error: any) {
      console.error('Create recurring series error:', error)
      return { success: false, error: error.message }
    }
  }

  // Generate appointments from a recurring series
  async generateAppointments(seriesId: string, maxToGenerate: number = 12): Promise<number> {
    try {
      const seriesResult = await query('SELECT * FROM recurring_series WHERE id = $1 AND is_active = true', [seriesId])
      if (!seriesResult.rows[0]) return 0

      const series = seriesResult.rows[0]
      const appointments: Date[] = []
      let currentDate = new Date(series.start_date)
      const endDate = series.end_date ? new Date(series.end_date) : null
      const maxOccurrences = series.max_occurrences || Infinity
      let occurrences = series.occurrences_created || 0

      while (appointments.length < maxToGenerate && occurrences < maxOccurrences) {
        if (endDate && currentDate > endDate) break

        // Check if this date works based on pattern
        let isValidDate = false

        switch (series.pattern) {
          case 'daily':
            isValidDate = true
            break
          case 'weekly':
            isValidDate = series.day_of_week === null || currentDate.getDay() === series.day_of_week
            break
          case 'biweekly':
            const weeksDiff = Math.floor((currentDate.getTime() - new Date(series.start_date).getTime()) / (7 * 24 * 60 * 60 * 1000))
            isValidDate = weeksDiff % 2 === 0 && (series.day_of_week === null || currentDate.getDay() === series.day_of_week)
            break
          case 'monthly':
            isValidDate = series.day_of_month === null || currentDate.getDate() === series.day_of_month
            break
          case 'custom':
            isValidDate = true
            break
        }

        if (isValidDate && currentDate > new Date()) {
          // Check staff availability
          const dateStr = currentDate.toISOString().split('T')[0]
          const availableSlots = await schedulingService.getAvailableSlots(
            series.staff_id,
            dateStr,
            series.duration_minutes
          )

          // Find a slot close to preferred time
          const preferredTime = series.preferred_time
          const [prefHours, prefMinutes] = preferredTime.split(':').map(Number)
          const preferredDateTime = new Date(currentDate)
          preferredDateTime.setHours(prefHours, prefMinutes, 0, 0)

          let bestSlot: string | null = null
          let minDiff = Infinity

          for (const slot of availableSlots) {
            const slotTime = new Date(slot)
            const diff = Math.abs(slotTime.getTime() - preferredDateTime.getTime())
            if (diff < minDiff) {
              minDiff = diff
              bestSlot = slot
            }
          }

          if (bestSlot) {
            appointments.push(new Date(bestSlot))
            occurrences++
          }
        }

        // Move to next date based on pattern
        switch (series.pattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + series.interval_value)
            break
          case 'weekly':
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 1)
            break
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + series.interval_value)
            break
          case 'custom':
            currentDate.setDate(currentDate.getDate() + series.interval_value)
            break
        }
      }

      // Create the appointments
      let created = 0
      for (const appointmentDate of appointments) {
        const endTime = new Date(appointmentDate.getTime() + series.duration_minutes * 60000)

        // Check for conflicts one more time
        const conflict = await schedulingService.checkConflict(
          series.staff_id,
          appointmentDate.toISOString(),
          endTime.toISOString()
        )

        if (!conflict.hasConflict) {
          const result = await query(
            `INSERT INTO appointments (
              business_id, client_id, staff_id, service_id, recurring_series_id,
              start_time, end_time, price, status, source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', 'recurring')
            RETURNING id`,
            [
              series.business_id, series.client_id, series.staff_id, series.service_id, seriesId,
              appointmentDate.toISOString(), endTime.toISOString(), series.price
            ]
          )

          if (result.rows[0]) {
            created++
            // Schedule reminders
            await notificationService.scheduleReminders(result.rows[0].id)
          }
        }
      }

      // Update occurrences count
      await query(
        'UPDATE recurring_series SET occurrences_created = occurrences_created + $1 WHERE id = $2',
        [created, seriesId]
      )

      return created
    } catch (error) {
      console.error('Generate appointments error:', error)
      return 0
    }
  }

  // Cancel a recurring series
  async cancelSeries(seriesId: string, cancelFutureAppointments: boolean = true): Promise<{ success: boolean; error?: string }> {
    try {
      await query('UPDATE recurring_series SET is_active = false WHERE id = $1', [seriesId])

      if (cancelFutureAppointments) {
        await query(
          `UPDATE appointments
           SET status = 'cancelled', cancellation_reason = 'Recurring series cancelled', cancelled_at = NOW()
           WHERE recurring_series_id = $1 AND start_time > NOW() AND status NOT IN ('cancelled', 'completed')`,
          [seriesId]
        )
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Update a recurring series
  async updateSeries(
    seriesId: string,
    updates: {
      staffId?: string
      preferredTime?: string
      endDate?: string
      maxOccurrences?: number
      notes?: string
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const setClauses: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (updates.staffId) {
        setClauses.push(`staff_id = $${paramIndex++}`)
        params.push(updates.staffId)
      }
      if (updates.preferredTime) {
        setClauses.push(`preferred_time = $${paramIndex++}`)
        params.push(updates.preferredTime)
      }
      if (updates.endDate !== undefined) {
        setClauses.push(`end_date = $${paramIndex++}`)
        params.push(updates.endDate)
      }
      if (updates.maxOccurrences !== undefined) {
        setClauses.push(`max_occurrences = $${paramIndex++}`)
        params.push(updates.maxOccurrences)
      }
      if (updates.notes !== undefined) {
        setClauses.push(`notes = $${paramIndex++}`)
        params.push(updates.notes)
      }

      if (setClauses.length === 0) {
        return { success: true }
      }

      params.push(seriesId)
      await query(
        `UPDATE recurring_series SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
        params
      )

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get client's recurring series
  async getClientRecurringSeries(clientId: string): Promise<any[]> {
    try {
      const result = await query(
        `SELECT rs.*, s.name as service_name, st.title as staff_title,
                u.first_name as staff_first_name, u.last_name as staff_last_name
         FROM recurring_series rs
         JOIN services s ON rs.service_id = s.id
         JOIN staff st ON rs.staff_id = st.id
         JOIN users u ON st.user_id = u.id
         WHERE rs.client_id = $1
         ORDER BY rs.created_at DESC`,
        [clientId]
      )
      return result.rows
    } catch (error) {
      console.error('Get client recurring series error:', error)
      return []
    }
  }

  // Cron job to generate future appointments
  async processRecurringSeries(): Promise<void> {
    try {
      // Get all active series that need more appointments generated
      const result = await query(
        `SELECT id FROM recurring_series
         WHERE is_active = true
         AND (max_occurrences IS NULL OR occurrences_created < max_occurrences)
         AND (end_date IS NULL OR end_date > CURRENT_DATE)`
      )

      for (const series of result.rows) {
        // Check if we need to generate more
        const futureCount = await query(
          `SELECT COUNT(*) as count FROM appointments
           WHERE recurring_series_id = $1 AND start_time > NOW() AND status NOT IN ('cancelled', 'no_show')`,
          [series.id]
        )

        if (parseInt(futureCount.rows[0].count) < 4) {
          await this.generateAppointments(series.id, 8)
        }
      }
    } catch (error) {
      console.error('Process recurring series error:', error)
    }
  }
}

export const recurringService = new RecurringService()
