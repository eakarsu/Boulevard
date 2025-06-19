import { Router } from 'express'
import { query } from '../../src/config/database.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Get bookable dates for cart
router.get('/cart-bookable-dates', async (req, res) => {
  try {
    const { id, searchRangeLower, searchRangeUpper, tz = 'America/Los_Angeles' } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Cart id is required' })
    }

    // Get cart location
    const cartResult = await query(`
      SELECT location_id FROM boulevard_carts WHERE cart_uuid = $1
    `, [id])

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const locationId = cartResult.rows[0].location_id

    // Get available dates (simplified - in real implementation would check staff availability)
    const datesResult = await query(`
      SELECT DISTINCT DATE(start_time) as date
      FROM boulevard_bookable_times
      WHERE location_id = $1 
        AND start_time >= $2 
        AND start_time <= $3
        AND is_available = true
      ORDER BY date
    `, [locationId, searchRangeLower, searchRangeUpper])

    const dates = datesResult.rows.map(row => ({
      date: row.date
    }))

    res.json({
      data: dates
    })
  } catch (error) {
    console.error('Error fetching bookable dates:', error)
    res.status(500).json({ error: 'Failed to fetch bookable dates' })
  }
})

// Get bookable times for specific date
router.get('/cart-bookable-times', async (req, res) => {
  try {
    const { id, searchDate, tz = 'America/Los_Angeles' } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Cart id is required' })
    }

    // Get cart location
    const cartResult = await query(`
      SELECT location_id FROM boulevard_carts WHERE cart_uuid = $1
    `, [id])

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const locationId = cartResult.rows[0].location_id

    // Get available times for the date
    const timesResult = await query(`
      SELECT 
        time_uuid as id,
        score,
        start_time
      FROM boulevard_bookable_times
      WHERE location_id = $1 
        AND DATE(start_time) = $2
        AND is_available = true
      ORDER BY start_time
    `, [locationId, searchDate])

    const times = timesResult.rows.map(row => ({
      id: row.id,
      score: row.score,
      startTime: row.start_time
    }))

    res.json({
      data: times
    })
  } catch (error) {
    console.error('Error fetching bookable times:', error)
    res.status(500).json({ error: 'Failed to fetch bookable times' })
  }
})

// Reserve bookable items
router.post('/reserve-cart-bookable-items', async (req, res) => {
  try {
    const { id: cartUuid, bookableTimeId } = req.body

    // Get cart
    const cartResult = await query(`
      SELECT id FROM boulevard_carts WHERE cart_uuid = $1
    `, [cartUuid])

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const cartId = cartResult.rows[0].id

    // Get bookable time
    const timeResult = await query(`
      SELECT id FROM boulevard_bookable_times WHERE time_uuid = $1 AND is_available = true
    `, [bookableTimeId])

    if (timeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Time slot not available' })
    }

    const bookableTimeDbId = timeResult.rows[0].id

    // Create reservation (expires in 15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
    
    await query(`
      INSERT INTO boulevard_cart_reservations (cart_id, bookable_time_id, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, bookable_time_id) 
      DO UPDATE SET expires_at = $3, reserved_at = CURRENT_TIMESTAMP
    `, [cartId, bookableTimeDbId, expiresAt])

    res.json({
      data: {
        reserveCartBookableItems: {
          cart: {
            id: cartUuid
          }
        }
      }
    })
  } catch (error) {
    console.error('Error reserving bookable items:', error)
    res.status(500).json({ error: 'Failed to reserve bookable items' })
  }
})

export default router
