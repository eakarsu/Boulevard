import { Router } from 'express'
import { schedulingService } from '../services/schedulingService.js'

const router = Router()

// Get staff availability for a date
router.get('/staff/:staffId/availability/:date', async (req, res) => {
  try {
    const { staffId, date } = req.params
    const availability = await schedulingService.getStaffAvailability(staffId, date)
    res.json({ data: availability })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get available time slots
router.get('/staff/:staffId/slots', async (req, res) => {
  try {
    const { staffId } = req.params
    const { date, duration, bufferBefore, bufferAfter } = req.query

    if (!date || !duration) {
      return res.status(400).json({ error: 'Date and duration are required' })
    }

    const slots = await schedulingService.getAvailableSlots(
      staffId,
      date as string,
      parseInt(duration as string),
      parseInt(bufferBefore as string) || 0,
      parseInt(bufferAfter as string) || 0
    )
    res.json({ data: slots })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Check for booking conflicts
router.post('/check-conflict', async (req, res) => {
  try {
    const { staffId, startTime, endTime, excludeAppointmentId } = req.body

    if (!staffId || !startTime || !endTime) {
      return res.status(400).json({ error: 'Staff ID, start time, and end time are required' })
    }

    const result = await schedulingService.checkConflict(staffId, startTime, endTime, excludeAppointmentId)
    res.json({ data: result })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Set staff weekly availability
router.put('/staff/:staffId/availability', async (req, res) => {
  try {
    const { staffId } = req.params
    const { availability } = req.body

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ error: 'Availability array is required' })
    }

    const result = await schedulingService.setStaffAvailability(staffId, availability)
    if (result.success) {
      res.json({ message: 'Availability updated successfully' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Add staff break
router.post('/staff/:staffId/breaks', async (req, res) => {
  try {
    const { staffId } = req.params
    const { dayOfWeek, startTime, endTime, name } = req.body

    const result = await schedulingService.addStaffBreak(staffId, dayOfWeek, startTime, endTime, name)
    if (result.success) {
      res.json({ data: { id: result.breakId }, message: 'Break added successfully' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Request time off
router.post('/staff/:staffId/time-off', async (req, res) => {
  try {
    const { staffId } = req.params
    const { startDate, endDate, isFullDay, startTime, endTime, reason } = req.body

    const result = await schedulingService.requestTimeOff(
      staffId, startDate, endDate, isFullDay, startTime, endTime, reason
    )
    if (result.success) {
      res.json({ data: { id: result.timeOffId }, message: 'Time off requested successfully' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Add schedule override
router.post('/staff/:staffId/schedule-override', async (req, res) => {
  try {
    const { staffId } = req.params
    const { date, isAvailable, startTime, endTime, reason } = req.body

    const result = await schedulingService.addScheduleOverride(
      staffId, date, isAvailable, startTime, endTime, reason
    )
    if (result.success) {
      res.json({ data: { id: result.overrideId }, message: 'Schedule override added' })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get staff schedule for date range
router.get('/staff/:staffId/schedule', async (req, res) => {
  try {
    const { staffId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' })
    }

    const schedule = await schedulingService.getStaffSchedule(
      staffId,
      startDate as string,
      endDate as string
    )
    res.json({ data: schedule })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
