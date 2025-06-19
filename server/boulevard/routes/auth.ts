import { Router } from 'express'
import { query } from '../../src/config/database.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Send cart ownership code by email
router.post('/send-cart-ownership-code-email', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const codeUuid = uuidv4()
    const codeValue = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await query(`
      INSERT INTO boulevard_cart_ownership_codes (code_uuid, email, code_value, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [codeUuid, email, codeValue, expiresAt])

    // In real implementation, send email here
    console.log(`Sending ownership code ${codeValue} to ${email}`)

    res.json({
      data: {
        sendCartOwnershipCodeByEmail: {
          cartOwnershipCodeId: codeUuid
        }
      }
    })
  } catch (error) {
    console.error('Error sending ownership code by email:', error)
    res.status(500).json({ error: 'Failed to send ownership code' })
  }
})

// Send cart ownership code by SMS
router.post('/send-cart-ownership-code-sms', async (req, res) => {
  try {
    const { mobilePhone } = req.body

    if (!mobilePhone) {
      return res.status(400).json({ error: 'Mobile phone is required' })
    }

    const codeUuid = uuidv4()
    const codeValue = Math.random().toString(36).substring(2, 8).toUpperCase()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await query(`
      INSERT INTO boulevard_cart_ownership_codes (code_uuid, mobile_phone, code_value, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [codeUuid, mobilePhone, codeValue, expiresAt])

    // In real implementation, send SMS here
    console.log(`Sending ownership code ${codeValue} to ${mobilePhone}`)

    res.json({
      data: {
        sendCartOwnershipCodeBySms: {
          cartOwnershipCodeId: codeUuid
        }
      }
    })
  } catch (error) {
    console.error('Error sending ownership code by SMS:', error)
    res.status(500).json({ error: 'Failed to send ownership code' })
  }
})

// Take cart ownership by code
router.post('/take-cart-ownership-by-code', async (req, res) => {
  try {
    const { cartId, cartOwnershipCodeId, cartOwnershipCodeValue } = req.body

    // Verify ownership code
    const codeResult = await query(`
      SELECT id, email, mobile_phone
      FROM boulevard_cart_ownership_codes
      WHERE code_uuid = $1 
        AND code_value = $2 
        AND expires_at > CURRENT_TIMESTAMP
        AND used_at IS NULL
    `, [cartOwnershipCodeId, cartOwnershipCodeValue])

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired ownership code' })
    }

    const code = codeResult.rows[0]

    // Mark code as used
    await query(`
      UPDATE boulevard_cart_ownership_codes
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [code.id])

    // Update cart with client information if available
    if (code.email) {
      await query(`
        UPDATE boulevard_carts
        SET client_email = $2, updated_at = CURRENT_TIMESTAMP
        WHERE cart_uuid = $1
      `, [cartId, code.email])
    }

    res.json({
      data: {
        takeCartOwnershipByCode: {
          cart: {
            id: cartId
          }
        }
      }
    })
  } catch (error) {
    console.error('Error taking cart ownership by code:', error)
    res.status(500).json({ error: 'Failed to take cart ownership' })
  }
})

// Take cart ownership (authenticated)
router.post('/take-cart-ownership', async (req, res) => {
  try {
    const { id: cartUuid } = req.body

    // In real implementation, verify authenticated token here
    // For now, just return success with mock payment methods

    const mockPaymentMethods = [
      {
        id: uuidv4(),
        name: 'Visa •••• •••• •••• 4210',
        cardBrand: 'Visa',
        cardLast4: '4210',
        cardExpMonth: 12,
        cardExpYear: 2025
      }
    ]

    res.json({
      data: {
        takeCartOwnership: {
          cart: {
            id: cartUuid,
            availablePaymentMethods: mockPaymentMethods
          }
        }
      }
    })
  } catch (error) {
    console.error('Error taking cart ownership:', error)
    res.status(500).json({ error: 'Failed to take cart ownership' })
  }
})

export default router
