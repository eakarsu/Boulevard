import { Router } from 'express'
import { query } from '../config/database.js'

const router = Router()

// =====================================================
// SERVICE CATEGORIES
// =====================================================

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'

    const result = await query(
      `SELECT sc.*, COUNT(s.id) as service_count
       FROM service_categories sc
       LEFT JOIN services s ON sc.id = s.category_id AND s.is_active = true
       WHERE sc.business_id = $1
       GROUP BY sc.id
       ORDER BY sc.sort_order ASC, sc.name ASC`,
      [businessId]
    )

    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Create category
router.post('/categories', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { name, description, sortOrder, color, icon } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' })
    }

    const result = await query(
      `INSERT INTO service_categories (business_id, name, description, sort_order, color, icon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [businessId, name, description, sortOrder || 0, color || '#3B82F6', icon || 'scissors']
    )

    res.json({ data: result.rows[0], message: 'Category created successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update category
router.put('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params
    const { name, description, sortOrder, color, icon, isActive } = req.body

    const setClauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`)
      params.push(name)
    }
    if (description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`)
      params.push(description)
    }
    if (sortOrder !== undefined) {
      setClauses.push(`sort_order = $${paramIndex++}`)
      params.push(sortOrder)
    }
    if (color !== undefined) {
      setClauses.push(`color = $${paramIndex++}`)
      params.push(color)
    }
    if (icon !== undefined) {
      setClauses.push(`icon = $${paramIndex++}`)
      params.push(icon)
    }
    if (isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`)
      params.push(isActive)
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    params.push(categoryId)
    const result = await query(
      `UPDATE service_categories SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    )

    res.json({ data: result.rows[0], message: 'Category updated successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete category
router.delete('/categories/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params

    // Set services to uncategorized (null)
    await query('UPDATE services SET category_id = NULL WHERE category_id = $1', [categoryId])
    await query('DELETE FROM service_categories WHERE id = $1', [categoryId])

    res.json({ message: 'Category deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// =====================================================
// SERVICES
// =====================================================

// Get all services with categories
router.get('/', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const { categoryId, isActive, search } = req.query

    let queryStr = `
      SELECT s.*, sc.name as category_name, sc.color as category_color,
             COUNT(DISTINCT ss.staff_id) as staff_count,
             COUNT(DISTINCT a.id) as booking_count
       FROM services s
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       LEFT JOIN staff_services ss ON s.id = ss.service_id
       LEFT JOIN appointments a ON s.id = a.service_id AND a.status = 'completed'
       WHERE s.business_id = $1
    `
    const params: any[] = [businessId]
    let paramIndex = 2

    if (categoryId) {
      queryStr += ` AND s.category_id = $${paramIndex++}`
      params.push(categoryId)
    }
    if (isActive !== undefined) {
      queryStr += ` AND s.is_active = $${paramIndex++}`
      params.push(isActive === 'true')
    }
    if (search) {
      queryStr += ` AND (s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    queryStr += ' GROUP BY s.id, sc.name, sc.color ORDER BY sc.sort_order ASC, s.name ASC'

    const result = await query(queryStr, params)
    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get service by ID with details
router.get('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params

    const serviceResult = await query(
      `SELECT s.*, sc.name as category_name
       FROM services s
       LEFT JOIN service_categories sc ON s.category_id = sc.id
       WHERE s.id = $1`,
      [serviceId]
    )

    if (!serviceResult.rows[0]) {
      return res.status(404).json({ error: 'Service not found' })
    }

    // Get add-ons
    const addonsResult = await query(
      'SELECT * FROM service_addons WHERE service_id = $1 AND is_active = true',
      [serviceId]
    )

    // Get staff who can perform this service
    const staffResult = await query(
      `SELECT ss.*, s.title, u.first_name, u.last_name
       FROM staff_services ss
       JOIN staff s ON ss.staff_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE ss.service_id = $1 AND ss.is_available = true AND s.is_active = true`,
      [serviceId]
    )

    res.json({
      data: {
        ...serviceResult.rows[0],
        addons: addonsResult.rows,
        staff: staffResult.rows
      }
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Create service
router.post('/', async (req, res) => {
  try {
    const businessId = (req as any).user?.businessId || '1'
    const {
      categoryId, name, description, durationMinutes, bufferBefore, bufferAfter,
      price, deposit, color, imageUrl, isActive, isBookableOnline, maxConcurrentBookings
    } = req.body

    if (!name || !durationMinutes || !price) {
      return res.status(400).json({ error: 'Name, duration, and price are required' })
    }

    const result = await query(
      `INSERT INTO services (
        business_id, category_id, name, description, duration_minutes,
        buffer_before_minutes, buffer_after_minutes, price, deposit, color,
        image_url, is_active, is_bookable_online, max_concurrent_bookings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        businessId, categoryId, name, description, durationMinutes,
        bufferBefore || 0, bufferAfter || 0, price, deposit, color || '#3B82F6',
        imageUrl, isActive !== false, isBookableOnline !== false, maxConcurrentBookings || 1
      ]
    )

    res.json({ data: result.rows[0], message: 'Service created successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update service
router.put('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params
    const updates = req.body

    const allowedFields = [
      'category_id', 'name', 'description', 'duration_minutes',
      'buffer_before_minutes', 'buffer_after_minutes', 'price', 'deposit',
      'color', 'image_url', 'is_active', 'is_bookable_online', 'max_concurrent_bookings'
    ]

    const setClauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    const fieldMap: { [key: string]: string } = {
      categoryId: 'category_id',
      durationMinutes: 'duration_minutes',
      bufferBefore: 'buffer_before_minutes',
      bufferAfter: 'buffer_after_minutes',
      imageUrl: 'image_url',
      isActive: 'is_active',
      isBookableOnline: 'is_bookable_online',
      maxConcurrentBookings: 'max_concurrent_bookings'
    }

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key] || key
      if (allowedFields.includes(dbField) && value !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex++}`)
        params.push(value)
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    params.push(serviceId)
    const result = await query(
      `UPDATE services SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    )

    res.json({ data: result.rows[0], message: 'Service updated successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete service (soft delete)
router.delete('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params

    await query('UPDATE services SET is_active = false WHERE id = $1', [serviceId])
    res.json({ message: 'Service deactivated successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// =====================================================
// SERVICE ADD-ONS
// =====================================================

// Get add-ons for a service
router.get('/:serviceId/addons', async (req, res) => {
  try {
    const { serviceId } = req.params

    const result = await query(
      'SELECT * FROM service_addons WHERE service_id = $1 ORDER BY name',
      [serviceId]
    )

    res.json({ data: result.rows })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Create add-on
router.post('/:serviceId/addons', async (req, res) => {
  try {
    const { serviceId } = req.params
    const { name, description, durationMinutes, price } = req.body

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' })
    }

    const result = await query(
      `INSERT INTO service_addons (service_id, name, description, duration_minutes, price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [serviceId, name, description, durationMinutes || 0, price]
    )

    res.json({ data: result.rows[0], message: 'Add-on created successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Update add-on
router.put('/addons/:addonId', async (req, res) => {
  try {
    const { addonId } = req.params
    const { name, description, durationMinutes, price, isActive } = req.body

    const result = await query(
      `UPDATE service_addons
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           duration_minutes = COALESCE($3, duration_minutes),
           price = COALESCE($4, price),
           is_active = COALESCE($5, is_active)
       WHERE id = $6
       RETURNING *`,
      [name, description, durationMinutes, price, isActive, addonId]
    )

    res.json({ data: result.rows[0], message: 'Add-on updated successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Delete add-on
router.delete('/addons/:addonId', async (req, res) => {
  try {
    const { addonId } = req.params
    await query('DELETE FROM service_addons WHERE id = $1', [addonId])
    res.json({ message: 'Add-on deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// =====================================================
// STAFF-SERVICE ASSIGNMENTS
// =====================================================

// Assign staff to service
router.post('/:serviceId/staff', async (req, res) => {
  try {
    const { serviceId } = req.params
    const { staffId, customPrice, customDuration } = req.body

    if (!staffId) {
      return res.status(400).json({ error: 'Staff ID is required' })
    }

    const result = await query(
      `INSERT INTO staff_services (staff_id, service_id, custom_price, custom_duration)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (staff_id, service_id) DO UPDATE SET
         custom_price = EXCLUDED.custom_price,
         custom_duration = EXCLUDED.custom_duration,
         is_available = true
       RETURNING *`,
      [staffId, serviceId, customPrice, customDuration]
    )

    res.json({ data: result.rows[0], message: 'Staff assigned to service' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Remove staff from service
router.delete('/:serviceId/staff/:staffId', async (req, res) => {
  try {
    const { serviceId, staffId } = req.params

    await query(
      'UPDATE staff_services SET is_available = false WHERE service_id = $1 AND staff_id = $2',
      [serviceId, staffId]
    )

    res.json({ message: 'Staff removed from service' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
