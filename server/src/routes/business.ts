import express from 'express'
import { query } from '../config/database.js'

const router = express.Router()

// Get business settings
router.get('/settings', async (req: any, res) => {
  try {
    const settingsQuery = `
      SELECT 
        b.*,
        ba.street, ba.city, ba.state, ba.zip_code, ba.country,
        bs.*
      FROM businesses b
      LEFT JOIN business_addresses ba ON b.id = ba.business_id
      LEFT JOIN business_settings bs ON b.id = bs.business_id
      WHERE b.owner_id = $1 OR b.id = $2
    `
    
    const result = await query(settingsQuery, [req.user.id, req.user.businessId])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' })
    }
    
    const business = result.rows[0]
    
    // Format response
    const formattedBusiness = {
      id: business.id,
      name: business.name,
      description: business.description,
      phone: business.phone,
      email: business.email,
      website: business.website,
      address: {
        street: business.street,
        city: business.city,
        state: business.state,
        zipCode: business.zip_code,
        country: business.country
      },
      settings: {
        timezone: business.timezone,
        currency: business.currency,
        bookingWindow: business.booking_window_days,
        cancellationPolicy: business.cancellation_policy,
        noShowPolicy: business.no_show_policy,
        requireDeposit: business.require_deposit,
        depositAmount: business.deposit_amount,
        allowOnlineBooking: business.allow_online_booking,
        autoConfirmBookings: business.auto_confirm_bookings,
        sendReminders: business.send_reminders,
        reminderTimes: business.reminder_times
      }
    }
    
    res.json(formattedBusiness)
  } catch (error) {
    console.error('Error fetching business settings:', error)
    res.status(500).json({ error: 'Failed to fetch business settings' })
  }
})

// Update business settings
router.put('/settings', async (req: any, res) => {
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
    
    const { name, email, phone, website, address, settings } = req.body
    
    // Update business
    await query(
      `UPDATE businesses 
       SET name = $1, email = $2, phone = $3, website = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [name, email, phone, website, businessId]
    )
    
    // Update address
    if (address) {
      await query(
        `UPDATE business_addresses 
         SET street = $1, city = $2, state = $3, zip_code = $4, country = $5
         WHERE business_id = $6`,
        [address.street, address.city, address.state, address.zipCode, address.country, businessId]
      )
    }
    
    // Update settings
    if (settings) {
      await query(
        `UPDATE business_settings 
         SET timezone = $1, currency = $2, booking_window_days = $3, 
             cancellation_policy = $4, no_show_policy = $5, require_deposit = $6,
             deposit_amount = $7, allow_online_booking = $8, auto_confirm_bookings = $9,
             send_reminders = $10, reminder_times = $11, updated_at = CURRENT_TIMESTAMP
         WHERE business_id = $12`,
        [
          settings.timezone, settings.currency, settings.bookingWindow,
          settings.cancellationPolicy, settings.noShowPolicy, settings.requireDeposit,
          settings.depositAmount, settings.allowOnlineBooking, settings.autoConfirmBookings,
          settings.sendReminders, settings.reminderTimes, businessId
        ]
      )
    }
    
    res.json({ message: 'Business settings updated successfully' })
  } catch (error) {
    console.error('Error updating business settings:', error)
    res.status(500).json({ error: 'Failed to update business settings' })
  }
})

export default router
