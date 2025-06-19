import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// Get all staff for a business
router.get('/', async (req: any, res) => {
  try {
    const { search, status } = req.query
    
    let whereClause = 'WHERE s.business_id = $1'
    const params = [req.user.businessId]
    let paramCount = 1

    if (search) {
      paramCount++
      whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR s.title ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (status && status !== 'all') {
      paramCount++
      whereClause += ` AND s.is_active = $${paramCount}`
      params.push(status === 'active')
    }

    const staffQuery = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.avatar_url,
        COUNT(CASE WHEN a.start_time::date = CURRENT_DATE THEN 1 END) as appointments_today,
        COUNT(CASE WHEN a.start_time >= DATE_TRUNC('week', CURRENT_DATE) 
                   AND a.start_time < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' 
                   THEN 1 END) as appointments_this_week,
        COALESCE(SUM(
          CASE WHEN a.start_time >= DATE_TRUNC('week', CURRENT_DATE) 
               AND a.start_time < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' 
               THEN a.price * (s.commission_rate / 100) ELSE 0 END
        ), 0) as revenue,
        CASE 
          WHEN COUNT(CASE WHEN a.start_time::date = CURRENT_DATE AND a.status = 'in_progress' THEN 1 END) > 0 THEN 'Busy'
          WHEN s.is_active = false THEN 'Off Today'
          ELSE 'Available'
        END as availability
      FROM staff s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN appointments a ON s.id = a.staff_id
      ${whereClause}
      GROUP BY s.id, u.id
      ORDER BY u.first_name, u.last_name
    `
    
    const result = await query(staffQuery, params)
    
    // Add mock ratings for now (in real app, this would come from reviews table)
    const staffWithRatings = result.rows.map(staff => ({
      ...staff,
      rating: 4.5 + Math.random() * 0.4, // Random rating between 4.5-4.9
      review_count: Math.floor(Math.random() * 200) + 20 // Random review count
    }))
    
    res.json({ data: staffWithRatings })
  } catch (error) {
    console.error('Error fetching staff:', error)
    res.status(500).json({ error: 'Failed to fetch staff' })
  }
})

// Get staff statistics
router.get('/stats', async (req: any, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_staff,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_staff,
        COALESCE(SUM(
          CASE WHEN a.start_time >= DATE_TRUNC('week', CURRENT_DATE) 
               AND a.start_time < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' 
               THEN a.price * (s.commission_rate / 100) ELSE 0 END
        ), 0) as weekly_revenue,
        COUNT(CASE WHEN a.start_time >= DATE_TRUNC('week', CURRENT_DATE) 
                   AND a.start_time < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week' 
                   THEN 1 END) as weekly_appointments
      FROM staff s
      LEFT JOIN appointments a ON s.id = a.staff_id
      WHERE s.business_id = $1
    `
    
    const result = await query(statsQuery, [req.user.businessId])
    res.json({ data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching staff stats:', error)
    res.status(500).json({ error: 'Failed to fetch staff statistics' })
  }
})

// Create new staff member
router.post('/', async (req: any, res) => {
  try {
    const { firstName, lastName, email, phone, title, skills, commissionRate, hourlyRate } = req.body
    
    // First create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'staff')
       RETURNING id`,
      [email, '$2b$10$defaulthash', firstName, lastName, phone] // In real app, hash a default password
    )
    
    const userId = userResult.rows[0].id
    
    // Then create staff record
    const staffResult = await query(
      `INSERT INTO staff (business_id, user_id, title, skills, commission_rate, hourly_rate)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.businessId, userId, title, skills, commissionRate, hourlyRate]
    )
    
    res.status(201).json(staffResult.rows[0])
  } catch (error) {
    console.error('Error creating staff:', error)
    res.status(500).json({ error: 'Failed to create staff member' })
  }
})

export default router
