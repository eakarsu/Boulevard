import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// Get all clients for a business
router.get('/', async (req: any, res) => {
  try {
    console.log('Fetching clients for user:', req.user)
    
    if (!req.user || !req.user.businessId) {
      return res.status(401).json({ error: 'Business ID not found in user context' })
    }
    
    const { search, status, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit
    
    let whereClause = 'WHERE c.business_id = $1'
    const params = [req.user.businessId]
    let paramCount = 1

    if (search) {
      paramCount++
      whereClause += ` AND (c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount} OR c.email ILIKE $${paramCount} OR c.phone ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (status && status !== 'all') {
      paramCount++
      if (status === 'active') {
        whereClause += ` AND c.last_visit > NOW() - INTERVAL '6 months'`
      } else if (status === 'vip') {
        whereClause += ` AND c.total_spent > 1000`
      } else if (status === 'inactive') {
        whereClause += ` AND (c.last_visit IS NULL OR c.last_visit <= NOW() - INTERVAL '6 months')`
      }
    }

    const clientsQuery = `
      SELECT 
        c.*,
        COUNT(a.id) as appointment_count,
        CASE 
          WHEN c.total_spent > 1000 THEN 'vip'
          WHEN c.last_visit > NOW() - INTERVAL '6 months' THEN 'active'
          ELSE 'inactive'
        END as status
      FROM clients c
      LEFT JOIN appointments a ON c.id = a.client_id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.last_visit DESC NULLS LAST
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `
    
    params.push(limit, offset)
    
    const result = await query(clientsQuery, params)
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM clients c
      ${whereClause}
    `
    const countResult = await query(countQuery, params.slice(0, -2))
    
    res.json({
      data: {
        clients: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    res.status(500).json({ error: 'Failed to fetch clients' })
  }
})

// Get client statistics
router.get('/stats', async (req: any, res) => {
  try {
    console.log('Fetching client stats for business:', req.user?.businessId)
    
    if (!req.user || !req.user.businessId) {
      return res.status(401).json({ error: 'Business ID not found in user context' })
    }
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN last_visit > NOW() - INTERVAL '6 months' OR total_spent > 1000 THEN 1 END) as active_clients,
        COUNT(CASE WHEN total_spent > 1000 THEN 1 END) as vip_clients,
        COALESCE(SUM(total_spent), 0) as total_revenue
      FROM clients 
      WHERE business_id = $1
    `
    
    const result = await query(statsQuery, [req.user.businessId])
    res.json({ data: result.rows[0] })
  } catch (error) {
    console.error('Error fetching client stats:', error)
    res.status(500).json({ error: 'Failed to fetch client statistics' })
  }
})

// Create new client
router.post('/', async (req: any, res) => {
  try {
    const { firstName, lastName, email, phone, notes } = req.body
    
    const result = await query(
      `INSERT INTO clients (business_id, first_name, last_name, email, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.businessId, firstName, lastName, email, phone, notes]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating client:', error)
    res.status(500).json({ error: 'Failed to create client' })
  }
})

// Update client
router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, notes } = req.body
    
    const result = await query(
      `UPDATE clients 
       SET first_name = $1, last_name = $2, email = $3, phone = $4, notes = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND business_id = $7
       RETURNING *`,
      [firstName, lastName, email, phone, notes, id, req.user.businessId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating client:', error)
    res.status(500).json({ error: 'Failed to update client' })
  }
})

export default router
