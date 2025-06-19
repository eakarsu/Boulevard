import { Router } from 'express'
import { query } from '../../src/config/database.js'

const router = Router()

// Get business locations
router.get('/business/locations', async (req, res) => {
  try {
    const { first = 20 } = req.query

    const result = await query(`
      SELECT 
        l.id,
        l.name,
        l.tz,
        l.address_line1 as "addressLine1",
        l.address_line2 as "addressLine2", 
        l.address_city as "addressCity",
        l.address_state as "addressState",
        l.address_zip as "addressZip"
      FROM boulevard_locations l
      LEFT JOIN boulevard_businesses b ON l.business_id = b.id
      ORDER BY l.name
      LIMIT $1
    `, [first])

    const locations = result.rows.map(row => ({
      node: {
        id: row.id.toString(),
        name: row.name,
        tz: row.tz,
        address: {
          line1: row.addressLine1,
          line2: row.addressLine2,
          city: row.addressCity,
          state: row.addressState,
          zip: row.addressZip
        }
      }
    }))

    res.json({
      data: {
        business: {
          locations: {
            edges: locations
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    res.status(500).json({ error: 'Failed to fetch locations' })
  }
})

export default router
