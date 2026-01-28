import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// Get all services for a business
router.get('/', async (req: any, res) => {
  try {
    const { search, category } = req.query

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Debug logging
    console.log('=== Services Route Debug ===')
    console.log('req.user:', JSON.stringify(req.user))

    // If businessId is not set, try to get it from the user's business ownership
    let businessId = req.user.businessId
    console.log('Initial businessId from user:', businessId, 'Type:', typeof businessId)

    if (!businessId) {
      console.log('Looking up business by owner_id:', req.user.id)
      const businessResult = await query(
        'SELECT id FROM businesses WHERE owner_id = $1 LIMIT 1',
        [req.user.id]
      )
      console.log('Business lookup result:', JSON.stringify(businessResult.rows))
      if (businessResult.rows.length > 0) {
        businessId = businessResult.rows[0].id
        console.log('Found businessId:', businessId)
      } else {
        return res.status(404).json({ error: 'No business found for user' })
      }
    }
    console.log('Final businessId:', businessId, 'Type:', typeof businessId)
    
    let whereClause = 'WHERE s.business_id = $1'
    const params = [businessId]
    let paramCount = 1

    if (search) {
      paramCount++
      whereClause += ` AND (s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (category && category !== 'All') {
      paramCount++
      whereClause += ` AND s.category = $${paramCount}`
      params.push(category)
    }

    const servicesQuery = `
      SELECT 
        s.*,
        0 as staff_count,
        COUNT(CASE WHEN a.start_time >= DATE_TRUNC('month', CURRENT_DATE) 
                   AND a.start_time < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' 
                   THEN 1 END) as bookings_this_month
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.name
    `
    
    const result = await query(servicesQuery, params)
    res.json({ data: result.rows })
  } catch (error) {
    console.error('Error fetching services:', error)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

// Get service statistics
router.get('/stats', async (req: any, res) => {
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
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_services,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_services,
        COALESCE(SUM(
          CASE WHEN a.start_time >= DATE_TRUNC('month', CURRENT_DATE) 
               AND a.start_time < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' 
               THEN COALESCE(s.price, 0) ELSE 0 END
        ), 0) as monthly_revenue,
        COUNT(CASE WHEN a.start_time >= DATE_TRUNC('month', CURRENT_DATE) 
                   AND a.start_time < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' 
                   THEN 1 END) as total_bookings
      FROM services s
      LEFT JOIN appointments a ON s.id = a.service_id
      WHERE s.business_id = $1
    `
    
    const result = await query(statsQuery, [businessId])
    res.json({ data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching service stats:', error)
    res.status(500).json({ error: 'Failed to fetch service statistics' })
  }
})

// Create new service
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
    
    const { name, description, category, duration_minutes, price, color } = req.body
    
    const result = await query(
      `INSERT INTO services (business_id, name, description, category, duration_minutes, price, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [businessId, name, description, category, duration_minutes, price, color]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating service:', error)
    res.status(500).json({ error: 'Failed to create service' })
  }
})

// Update service
router.put('/:id', async (req: any, res) => {
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
    
    const { id } = req.params
    const { name, description, category, duration_minutes, price, color, is_active } = req.body
    
    const result = await query(
      `UPDATE services 
       SET name = $1, description = $2, category = $3, duration_minutes = $4, 
           price = $5, color = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND business_id = $9
       RETURNING *`,
      [name, description, category, duration_minutes, price, color, is_active, id, businessId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating service:', error)
    res.status(500).json({ error: 'Failed to update service' })
  }
})

// Delete service
router.delete('/:id', async (req: any, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

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

    const { id } = req.params

    const result = await query(
      'DELETE FROM services WHERE id = $1 AND business_id = $2 RETURNING *',
      [id, businessId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' })
    }

    res.json({ message: 'Service deleted successfully', id })
  } catch (error) {
    console.error('Error deleting service:', error)
    res.status(500).json({ error: 'Failed to delete service' })
  }
})

export default router
