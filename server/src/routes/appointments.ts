import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// Get appointments for calendar view
router.get('/', async (req: any, res) => {
  try {
    const { start_date, end_date, staff_id } = req.query
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }
    
    // If businessId is not set, try to get it from the user's business ownership
    let businessId = req.user.businessId
    if (!businessId) {
      const businessResult = await query(
        'SELECT id FROM businesses WHERE owner_id = $1 LIMIT 1',
        [req.user.id]
      )
      if (businessResult.rows.length > 0) {
        businessId = businessResult.rows[0].id
      } else {
        return res.status(404).json({ error: 'No business found for user' })
      }
    }
    
    let whereClause = 'WHERE a.business_id = $1'
    const params = [businessId]
    let paramCount = 1

    if (start_date && end_date) {
      paramCount += 2
      whereClause += ` AND a.start_time >= $${paramCount - 1} AND a.start_time <= $${paramCount}`
      params.push(start_date, end_date)
    }

    if (staff_id) {
      paramCount++
      whereClause += ` AND a.staff_id = $${paramCount}`
      params.push(staff_id)
    }

    const appointmentsQuery = `
      SELECT 
        a.*,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        u.first_name as staff_first_name,
        u.last_name as staff_last_name,
        s.name as service_name,
        s.color as service_color
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN staff st ON a.staff_id = st.id
      JOIN users u ON st.user_id = u.id
      JOIN services s ON a.service_id = s.id
      ${whereClause}
      ORDER BY a.start_time
    `
    
    const result = await query(appointmentsQuery, params)
    
    // Format for calendar display
    const formattedAppointments = result.rows.map(apt => ({
      id: apt.id,
      clientName: `${apt.client_first_name} ${apt.client_last_name}`,
      service: apt.service_name,
      staff: `${apt.staff_first_name} ${apt.staff_last_name}`,
      startTime: new Date(apt.start_time).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      endTime: new Date(apt.end_time).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      date: new Date(apt.start_time),
      status: apt.status,
      color: apt.service_color || '#3B82F6'
    }))
    
    res.json({ data: formattedAppointments })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    res.status(500).json({ error: 'Failed to fetch appointments' })
  }
})

// Create new appointment
router.post('/', async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }
    
    // If businessId is not set, try to get it from the user's business ownership
    let businessId = req.user.businessId
    if (!businessId) {
      const businessResult = await query(
        'SELECT id FROM businesses WHERE owner_id = $1 LIMIT 1',
        [req.user.id]
      )
      if (businessResult.rows.length > 0) {
        businessId = businessResult.rows[0].id
      } else {
        return res.status(404).json({ error: 'No business found for user' })
      }
    }
    
    const { clientId, staffId, serviceId, startTime, endTime, notes } = req.body
    
    // Get service price
    const serviceResult = await query(
      'SELECT price FROM services WHERE id = $1',
      [serviceId]
    )
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' })
    }
    
    const price = serviceResult.rows[0].price
    
    // Get default location (in real app, this would be selected)
    const locationResult = await query(
      'SELECT id FROM locations WHERE business_id = $1 LIMIT 1',
      [businessId]
    )
    
    const locationId = locationResult.rows[0]?.id
    
    const result = await query(
      `INSERT INTO appointments (business_id, location_id, client_id, staff_id, service_id, start_time, end_time, price, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [businessId, locationId, clientId, staffId, serviceId, startTime, endTime, price, notes]
    )
    
    // Emit real-time update
    const io = req.app.get('io')
    io.to(`business-${businessId}`).emit('appointment-created', result.rows[0])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating appointment:', error)
    res.status(500).json({ error: 'Failed to create appointment' })
  }
})

// Update appointment
router.put('/:id', async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params
    const { clientId, staffId, serviceId, startTime, endTime, status, notes } = req.body

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const params: any[] = []
    let paramCount = 0

    if (clientId) {
      paramCount++
      updates.push(`client_id = $${paramCount}`)
      params.push(clientId)
    }
    if (staffId) {
      paramCount++
      updates.push(`staff_id = $${paramCount}`)
      params.push(staffId)
    }
    if (serviceId) {
      paramCount++
      updates.push(`service_id = $${paramCount}`)
      params.push(serviceId)
    }
    if (startTime) {
      paramCount++
      updates.push(`start_time = $${paramCount}`)
      params.push(startTime)
    }
    if (endTime) {
      paramCount++
      updates.push(`end_time = $${paramCount}`)
      params.push(endTime)
    }
    if (status) {
      paramCount++
      updates.push(`status = $${paramCount}`)
      params.push(status)
    }
    if (notes !== undefined) {
      paramCount++
      updates.push(`notes = $${paramCount}`)
      params.push(notes)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    paramCount++
    updates.push(`updated_at = NOW()`)
    params.push(id)

    const result = await query(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.emit('appointment-updated', result.rows[0])
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating appointment:', error)
    res.status(500).json({ error: 'Failed to update appointment' })
  }
})

// Delete appointment
router.delete('/:id', async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { id } = req.params

    const result = await query(
      'DELETE FROM appointments WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.emit('appointment-deleted', { id })
    }

    res.json({ message: 'Appointment deleted successfully', id })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    res.status(500).json({ error: 'Failed to delete appointment' })
  }
})

export default router
