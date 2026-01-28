import { query } from '../config/database.js'

// Scheduling Service - Handles staff availability and booking conflicts
export class SchedulingService {

  // Get staff availability for a specific date
  async getStaffAvailability(staffId: string, date: string): Promise<{
    available: boolean
    slots: { start: string; end: string }[]
    breaks: { start: string; end: string; name: string }[]
    bookedSlots: { start: string; end: string; appointmentId: string }[]
  }> {
    try {
      const targetDate = new Date(date)
      const dayOfWeek = targetDate.getDay()

      // Check for time off
      const timeOffResult = await query(
        `SELECT * FROM staff_time_off
         WHERE staff_id = $1
         AND start_date <= $2 AND end_date >= $2
         AND status = 'approved'`,
        [staffId, date]
      )

      if (timeOffResult.rows.length > 0) {
        const timeOff = timeOffResult.rows[0]
        if (timeOff.is_full_day) {
          return { available: false, slots: [], breaks: [], bookedSlots: [] }
        }
      }

      // Check for schedule overrides
      const overrideResult = await query(
        `SELECT * FROM staff_schedule_overrides WHERE staff_id = $1 AND date = $2`,
        [staffId, date]
      )

      let availabilitySlots: { start: string; end: string }[] = []

      if (overrideResult.rows.length > 0) {
        const override = overrideResult.rows[0]
        if (!override.is_available) {
          return { available: false, slots: [], breaks: [], bookedSlots: [] }
        }
        if (override.start_time && override.end_time) {
          availabilitySlots.push({
            start: override.start_time,
            end: override.end_time
          })
        }
      } else {
        // Get regular availability
        const availResult = await query(
          `SELECT start_time, end_time FROM staff_availability
           WHERE staff_id = $1 AND day_of_week = $2 AND is_available = true`,
          [staffId, dayOfWeek]
        )
        availabilitySlots = availResult.rows.map(row => ({
          start: row.start_time,
          end: row.end_time
        }))
      }

      if (availabilitySlots.length === 0) {
        return { available: false, slots: [], breaks: [], bookedSlots: [] }
      }

      // Get breaks
      const breaksResult = await query(
        `SELECT start_time, end_time, name FROM staff_breaks
         WHERE staff_id = $1 AND day_of_week = $2`,
        [staffId, dayOfWeek]
      )
      const breaks = breaksResult.rows.map(row => ({
        start: row.start_time,
        end: row.end_time,
        name: row.name
      }))

      // Get booked appointments
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`

      const appointmentsResult = await query(
        `SELECT id, start_time, end_time FROM appointments
         WHERE staff_id = $1
         AND start_time >= $2 AND start_time <= $3
         AND status NOT IN ('cancelled', 'no_show')`,
        [staffId, startOfDay, endOfDay]
      )
      const bookedSlots = appointmentsResult.rows.map(row => ({
        start: new Date(row.start_time).toISOString(),
        end: new Date(row.end_time).toISOString(),
        appointmentId: row.id
      }))

      // Get external calendar events
      const externalResult = await query(
        `SELECT start_time, end_time FROM external_calendar_events
         WHERE staff_id = $1 AND start_time >= $2 AND start_time <= $3`,
        [staffId, startOfDay, endOfDay]
      )
      externalResult.rows.forEach(row => {
        bookedSlots.push({
          start: new Date(row.start_time).toISOString(),
          end: new Date(row.end_time).toISOString(),
          appointmentId: 'external'
        })
      })

      return {
        available: true,
        slots: availabilitySlots,
        breaks,
        bookedSlots
      }
    } catch (error) {
      console.error('Get staff availability error:', error)
      return { available: false, slots: [], breaks: [], bookedSlots: [] }
    }
  }

  // Get available time slots for booking
  async getAvailableSlots(
    staffId: string,
    date: string,
    serviceDuration: number,
    bufferBefore: number = 0,
    bufferAfter: number = 0
  ): Promise<string[]> {
    const availability = await this.getStaffAvailability(staffId, date)
    if (!availability.available) return []

    const totalDuration = serviceDuration + bufferBefore + bufferAfter
    const slotInterval = 15 // 15-minute intervals
    const availableSlots: string[] = []

    for (const slot of availability.slots) {
      const slotStart = this.parseTime(slot.start, date)
      const slotEnd = this.parseTime(slot.end, date)

      let currentTime = new Date(slotStart)

      while (currentTime.getTime() + totalDuration * 60000 <= slotEnd.getTime()) {
        const endTime = new Date(currentTime.getTime() + totalDuration * 60000)

        // Check if this slot conflicts with any booked slots
        const hasConflict = availability.bookedSlots.some(booked => {
          const bookedStart = new Date(booked.start)
          const bookedEnd = new Date(booked.end)
          return currentTime < bookedEnd && endTime > bookedStart
        })

        // Check if this slot conflicts with any breaks
        const inBreak = availability.breaks.some(breakSlot => {
          const breakStart = this.parseTime(breakSlot.start, date)
          const breakEnd = this.parseTime(breakSlot.end, date)
          return currentTime < breakEnd && endTime > breakStart
        })

        if (!hasConflict && !inBreak) {
          availableSlots.push(currentTime.toISOString())
        }

        currentTime = new Date(currentTime.getTime() + slotInterval * 60000)
      }
    }

    return availableSlots
  }

  // Check for booking conflicts
  async checkConflict(
    staffId: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Promise<{ hasConflict: boolean; conflictingAppointments: any[] }> {
    try {
      let queryStr = `
        SELECT a.*, c.first_name, c.last_name, s.name as service_name
        FROM appointments a
        JOIN clients c ON a.client_id = c.id
        JOIN services s ON a.service_id = s.id
        WHERE a.staff_id = $1
        AND a.status NOT IN ('cancelled', 'no_show')
        AND a.start_time < $3 AND a.end_time > $2
      `
      const params: any[] = [staffId, startTime, endTime]

      if (excludeAppointmentId) {
        queryStr += ' AND a.id != $4'
        params.push(excludeAppointmentId)
      }

      const result = await query(queryStr, params)

      return {
        hasConflict: result.rows.length > 0,
        conflictingAppointments: result.rows
      }
    } catch (error) {
      console.error('Check conflict error:', error)
      return { hasConflict: true, conflictingAppointments: [] }
    }
  }

  // Set staff weekly availability
  async setStaffAvailability(
    staffId: string,
    availability: {
      dayOfWeek: number
      startTime: string
      endTime: string
      isAvailable: boolean
    }[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete existing availability
      await query('DELETE FROM staff_availability WHERE staff_id = $1', [staffId])

      // Insert new availability
      for (const slot of availability) {
        await query(
          `INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
           VALUES ($1, $2, $3, $4, $5)`,
          [staffId, slot.dayOfWeek, slot.startTime, slot.endTime, slot.isAvailable]
        )
      }

      return { success: true }
    } catch (error: any) {
      console.error('Set staff availability error:', error)
      return { success: false, error: error.message }
    }
  }

  // Add staff break
  async addStaffBreak(
    staffId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    name: string = 'Break'
  ): Promise<{ success: boolean; breakId?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO staff_breaks (staff_id, day_of_week, start_time, end_time, name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [staffId, dayOfWeek, startTime, endTime, name]
      )
      return { success: true, breakId: result.rows[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Request time off
  async requestTimeOff(
    staffId: string,
    startDate: string,
    endDate: string,
    isFullDay: boolean = true,
    startTime?: string,
    endTime?: string,
    reason?: string
  ): Promise<{ success: boolean; timeOffId?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO staff_time_off (staff_id, start_date, end_date, is_full_day, start_time, end_time, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
         RETURNING id`,
        [staffId, startDate, endDate, isFullDay, startTime, endTime, reason]
      )
      return { success: true, timeOffId: result.rows[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Add schedule override (special hours for a specific date)
  async addScheduleOverride(
    staffId: string,
    date: string,
    isAvailable: boolean,
    startTime?: string,
    endTime?: string,
    reason?: string
  ): Promise<{ success: boolean; overrideId?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO staff_schedule_overrides (staff_id, date, is_available, start_time, end_time, reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (staff_id, date) DO UPDATE SET
           is_available = EXCLUDED.is_available,
           start_time = EXCLUDED.start_time,
           end_time = EXCLUDED.end_time,
           reason = EXCLUDED.reason
         RETURNING id`,
        [staffId, date, isAvailable, startTime, endTime, reason]
      )
      return { success: true, overrideId: result.rows[0].id }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Get staff schedule for date range
  async getStaffSchedule(staffId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const schedule: any[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        const availability = await this.getStaffAvailability(staffId, dateStr)
        schedule.push({
          date: dateStr,
          ...availability
        })
      }

      return schedule
    } catch (error) {
      console.error('Get staff schedule error:', error)
      return []
    }
  }

  private parseTime(timeStr: string, dateStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number)
    const date = new Date(dateStr)
    date.setHours(hours, minutes, 0, 0)
    return date
  }
}

export const schedulingService = new SchedulingService()
