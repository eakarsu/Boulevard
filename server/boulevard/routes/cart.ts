import { Router } from 'express'
import { query } from '../../src/config/database.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Create cart
router.post('/cart/create', async (req, res) => {
  try {
    const { locationId } = req.body

    if (!locationId) {
      return res.status(400).json({ error: 'locationId is required' })
    }

    const cartUuid = `urn:blvd:Cart:${uuidv4()}`

    // Create cart
    const cartResult = await query(`
      INSERT INTO boulevard_carts (cart_uuid, location_id)
      VALUES ($1, $2)
      RETURNING id, cart_uuid, payment_info_required, gift_card_purchase_enabled
    `, [cartUuid, locationId])

    const cart = cartResult.rows[0]

    // Get available categories and items
    const categoriesResult = await query(`
      SELECT 
        c.id as category_id,
        c.name as category_name,
        s.id as service_id,
        s.name as service_name,
        s.service_type
      FROM boulevard_categories c
      LEFT JOIN boulevard_services s ON c.id = s.category_id AND s.is_active = true
      WHERE c.location_id = $1
      ORDER BY c.sort_order, c.name, s.name
    `, [locationId])

    // Group services by category
    const categoriesMap = new Map()
    
    categoriesResult.rows.forEach(row => {
      if (!categoriesMap.has(row.category_id)) {
        categoriesMap.set(row.category_id, {
          name: row.category_name,
          availableItems: []
        })
      }
      
      if (row.service_id) {
        const typename = row.service_type === 'bookable' ? 'CartAvailableBookableItem' :
                        row.service_type === 'purchasable' ? 'CartAvailablePurchasableItem' :
                        'CartAvailableGiftCardItem'
        
        categoriesMap.get(row.category_id).availableItems.push({
          id: `urn:blvd:Service:${row.service_id}`,
          name: row.service_name,
          __typename: typename
        })
      }
    })

    const availableCategories = Array.from(categoriesMap.values())

    res.json({
      data: {
        createCart: {
          cart: {
            id: cart.cart_uuid,
            features: {
              paymentInfoRequired: cart.payment_info_required,
              giftCardPurchaseEnabled: cart.gift_card_purchase_enabled
            },
            availablePaymentMethods: [],
            availableCategories
          }
        }
      }
    })
  } catch (error) {
    console.error('Error creating cart:', error)
    res.status(500).json({ error: 'Failed to create cart' })
  }
})

// Get cart available item details
router.get('/cart/:cartId/item/:itemId', async (req, res) => {
  try {
    const { cartId, itemId } = req.params
    
    // Extract service ID from URN format
    const serviceId = itemId.replace('urn:blvd:Service:', '')

    const serviceResult = await query(`
      SELECT s.id, s.name, s.description
      FROM boulevard_services s
      WHERE s.id = $1 AND s.is_active = true
    `, [serviceId])

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const service = serviceResult.rows[0]

    // Get staff variants
    const variantsResult = await query(`
      SELECT 
        sv.id,
        sv.price,
        sv.duration,
        st.first_name,
        st.last_name,
        st.bio
      FROM boulevard_staff_service_variants sv
      JOIN boulevard_staff st ON sv.staff_id = st.id
      WHERE sv.service_id = $1 AND sv.is_available = true AND st.is_active = true
      ORDER BY st.first_name, st.last_name
    `, [serviceId])

    const staffVariants = variantsResult.rows.map(row => ({
      id: row.id.toString(),
      price: parseFloat(row.price),
      duration: row.duration,
      staff: {
        firstName: row.first_name,
        lastName: row.last_name,
        bio: row.bio
      }
    }))

    res.json({
      data: {
        cart: {
          id: cartId,
          availableItem: {
            id: itemId,
            name: service.name,
            description: service.description,
            staffVariants
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching cart item:', error)
    res.status(500).json({ error: 'Failed to fetch cart item' })
  }
})

// Add bookable item to cart
router.post('/cart/add-bookable-item', async (req, res) => {
  try {
    const { id: cartUuid, itemId, itemStaffVariantId, itemGuestId } = req.body

    // Get cart
    const cartResult = await query(`
      SELECT id FROM boulevard_carts WHERE cart_uuid = $1
    `, [cartUuid])

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const cartId = cartResult.rows[0].id
    const serviceId = itemId.replace('urn:blvd:Service:', '')

    // Get service and staff variant details
    let price, duration
    
    if (itemStaffVariantId) {
      const variantResult = await query(`
        SELECT price, duration FROM boulevard_staff_service_variants
        WHERE id = $1 AND service_id = $2
      `, [itemStaffVariantId, serviceId])
      
      if (variantResult.rows.length === 0) {
        return res.status(404).json({ error: 'Staff variant not found' })
      }
      
      price = variantResult.rows[0].price
      duration = variantResult.rows[0].duration
    } else {
      const serviceResult = await query(`
        SELECT base_price, base_duration FROM boulevard_services
        WHERE id = $1
      `, [serviceId])
      
      price = serviceResult.rows[0].base_price
      duration = serviceResult.rows[0].base_duration
    }

    // Add item to cart
    await query(`
      INSERT INTO boulevard_cart_items (cart_id, service_id, staff_variant_id, guest_id, price, duration)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [cartId, serviceId, itemStaffVariantId || null, itemGuestId || null, price, duration])

    res.json({
      data: {
        addCartSelectedBookableItem: {
          cart: {
            id: cartUuid
          }
        }
      }
    })
  } catch (error) {
    console.error('Error adding item to cart:', error)
    res.status(500).json({ error: 'Failed to add item to cart' })
  }
})

// Update cart with client information
router.post('/cart/update', async (req, res) => {
  try {
    const { id: cartUuid, clientInformation } = req.body

    await query(`
      UPDATE boulevard_carts 
      SET 
        client_email = $2,
        client_first_name = $3,
        client_last_name = $4,
        client_phone = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE cart_uuid = $1
    `, [
      cartUuid,
      clientInformation.email,
      clientInformation.firstName,
      clientInformation.lastName,
      clientInformation.phoneNumber
    ])

    res.json({
      data: {
        updateCart: {
          cart: {
            id: cartUuid
          }
        }
      }
    })
  } catch (error) {
    console.error('Error updating cart:', error)
    res.status(500).json({ error: 'Failed to update cart' })
  }
})

// Create cart guest
router.post('/create-cart-guest', async (req, res) => {
  try {
    const { id: cartUuid, email, firstName, lastName, phoneNumber } = req.body

    const cartResult = await query(`
      SELECT id FROM boulevard_carts WHERE cart_uuid = $1
    `, [cartUuid])

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const cartId = cartResult.rows[0].id
    const guestUuid = uuidv4()

    const guestResult = await query(`
      INSERT INTO boulevard_cart_guests (cart_id, guest_uuid, email, first_name, last_name, phone_number)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, guest_uuid, first_name, last_name, email
    `, [cartId, guestUuid, email, firstName, lastName, phoneNumber])

    const guest = guestResult.rows[0]

    // Get all guests for this cart
    const guestsResult = await query(`
      SELECT guest_uuid as id, first_name, last_name, email
      FROM boulevard_cart_guests
      WHERE cart_id = $1
    `, [cartId])

    res.json({
      data: {
        createCartGuest: {
          cart: {
            id: cartUuid,
            guests: guestsResult.rows
          }
        }
      }
    })
  } catch (error) {
    console.error('Error creating cart guest:', error)
    res.status(500).json({ error: 'Failed to create cart guest' })
  }
})

// Add card payment method
router.post('/add-cart-card-payment-method', async (req, res) => {
  try {
    const { id: cartUuid, token, select } = req.body

    const cartResult = await query(`
      SELECT id FROM boulevard_carts WHERE cart_uuid = $1
    `, [cartUuid])

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const cartId = cartResult.rows[0].id

    // Unselect other payment methods if this one is being selected
    if (select) {
      await query(`
        UPDATE boulevard_payment_methods 
        SET is_selected = false 
        WHERE cart_id = $1
      `, [cartId])
    }

    // Add payment method (in real implementation, you'd decode the token)
    await query(`
      INSERT INTO boulevard_payment_methods (cart_id, method_type, token, is_selected)
      VALUES ($1, 'card', $2, $3)
    `, [cartId, token, select])

    res.json({
      data: {
        addCartCardPaymentMethod: {
          cart: {
            id: cartUuid
          }
        }
      }
    })
  } catch (error) {
    console.error('Error adding payment method:', error)
    res.status(500).json({ error: 'Failed to add payment method' })
  }
})

// Checkout cart
router.post('/checkout-cart', async (req, res) => {
  try {
    const { id: cartUuid } = req.body

    // Update cart as completed
    const result = await query(`
      UPDATE boulevard_carts 
      SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE cart_uuid = $1
      RETURNING completed_at
    `, [cartUuid])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    res.json({
      data: {
        checkoutCart: {
          cart: {
            id: cartUuid,
            completedAt: result.rows[0].completed_at
          }
        }
      }
    })
  } catch (error) {
    console.error('Error checking out cart:', error)
    res.status(500).json({ error: 'Failed to checkout cart' })
  }
})

export default router
