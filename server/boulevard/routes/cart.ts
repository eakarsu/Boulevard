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

    // Validate that location exists
    const locationCheck = await query(`
      SELECT id FROM boulevard_locations WHERE id = $1
    `, [locationId])

    if (locationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' })
    }

    const cartUuid = `urn:blvd:Cart:${uuidv4()}`

    // Create cart
    const cartResult = await query(`
      INSERT INTO boulevard_carts (cart_uuid, location_id, payment_info_required, gift_card_purchase_enabled)
      VALUES ($1, $2, false, false)
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
    
    // Handle gift card items
    if (itemId === 'GIFT_CARD') {
      return res.json({
        data: {
          cart: {
            id: cartId,
            availableItem: {
              id: itemId,
              __typename: "CartAvailableGiftCardItem",
              name: "Gift Card",
              description: "Give the gift of beauty and wellness",
              listPriceRange: {
                min: 2500, // $25.00 in cents
                max: 50000, // $500.00 in cents
                variable: true
              },
              pricePresets: [2500, 5000, 10000, 15000, 20000],
              giftCardMin: 2500,
              giftCardMax: 50000
            }
          }
        }
      })
    }

    // Extract service ID from URN format
    const serviceId = itemId.replace('urn:blvd:Service:', '')

    const serviceResult = await query(`
      SELECT s.id, s.name, s.description, s.base_price, s.service_type
      FROM boulevard_services s
      WHERE s.id = $1 AND s.is_active = true
    `, [serviceId])

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' })
    }

    const service = serviceResult.rows[0]

    // Handle purchasable items (products/memberships)
    if (service.service_type === 'purchasable') {
      return res.json({
        data: {
          cart: {
            id: cartId,
            availableItem: {
              id: itemId,
              __typename: "CartAvailablePurchasableItem",
              name: service.name,
              description: service.description,
              listPriceRange: {
                min: Math.round(service.base_price * 100), // Convert to cents
                max: Math.round(service.base_price * 100),
                variable: false
              }
            }
          }
        }
      })
    }

    // Handle bookable services - get staff variants
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
            __typename: "CartAvailableBookableItem",
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
      INSERT INTO boulevard_cart_items (cart_id, service_id, staff_variant_id, guest_id, price, duration, item_type)
      VALUES ($1, $2, $3, $4, $5, $6, 'bookable')
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

// Add purchasable item to cart (matches book5.txt specification)
router.post('/cart/add-purchasable-item', async (req, res) => {
  try {
    const { input } = req.body
    const { id: cartUuid, itemId } = input

    if (!cartUuid || !itemId) {
      return res.status(400).json({ error: 'Cart ID and item ID are required' })
    }

    // Extract service ID from URN
    const serviceId = itemId.replace('urn:blvd:Service:', '').replace('urn:blvd:ProductLocation:', '')

    // Get cart
    const cartResult = await query('SELECT id FROM boulevard_carts WHERE cart_uuid = $1', [cartUuid])
    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const cartId = cartResult.rows[0].id

    // Verify service exists and is purchasable
    const serviceResult = await query(`
      SELECT id, name, service_type, base_price FROM boulevard_services 
      WHERE id = $1 AND service_type = 'purchasable' AND is_active = true
    `, [serviceId])

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Purchasable item not found' })
    }

    const service = serviceResult.rows[0]

    // Add item to cart
    await query(`
      INSERT INTO boulevard_cart_items (cart_id, service_id, item_type, price)
      VALUES ($1, $2, 'purchasable', $3)
    `, [cartId, serviceId, service.base_price])

    res.json({
      data: {
        addCartSelectedPurchasableItem: {
          cart: {
            id: cartUuid
          }
        }
      }
    })
  } catch (error) {
    console.error('Error adding purchasable item:', error)
    res.status(500).json({ error: 'Failed to add purchasable item' })
  }
})

// Add gift card item to cart (matches book5.txt specification)
router.post('/cart/add-gift-card-item', async (req, res) => {
  try {
    const { input } = req.body
    const { id: cartUuid, itemId, itemPrice } = input

    if (!cartUuid || !itemId || !itemPrice) {
      return res.status(400).json({ error: 'Cart ID, item ID, and price are required' })
    }

    // Get cart
    const cartResult = await query('SELECT id FROM boulevard_carts WHERE cart_uuid = $1', [cartUuid])
    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cart not found' })
    }

    const cartId = cartResult.rows[0].id

    // Add gift card to cart
    const giftCardUuid = `urn:blvd:GiftCard:${uuidv4()}`
    await query(`
      INSERT INTO boulevard_cart_items (cart_id, service_id, item_type, gift_card_uuid, gift_card_price)
      VALUES ($1, 13, 'gift_card', $2, $3)
    `, [cartId, giftCardUuid, itemPrice])

    res.json({
      data: {
        addCartSelectedGiftCardItem: {
          cart: {
            id: cartUuid
          }
        }
      }
    })
  } catch (error) {
    console.error('Error adding gift card item:', error)
    res.status(500).json({ error: 'Failed to add gift card item' })
  }
})

// Create gift card email fulfillment (matches book5.txt specification)
router.post('/cart/create-gift-card-email-fulfillment', async (req, res) => {
  try {
    const { input } = req.body
    const { 
      id: cartUuid, 
      itemId, 
      messageFromSender, 
      senderName, 
      recipientEmail, 
      recipientName, 
      deliveryDate 
    } = input

    if (!cartUuid || !itemId || !recipientEmail) {
      return res.status(400).json({ error: 'Cart ID, item ID, and recipient email are required' })
    }

    // Get cart and gift card item
    const cartResult = await query(`
      SELECT ci.id as cart_item_id, ci.gift_card_uuid
      FROM boulevard_cart_items ci
      JOIN boulevard_carts c ON ci.cart_id = c.id
      WHERE c.cart_uuid = $1 AND ci.gift_card_uuid = $2
    `, [cartUuid, itemId])

    if (cartResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gift card item not found in cart' })
    }

    const { cart_item_id, gift_card_uuid } = cartResult.rows[0]
    const fulfillmentId = uuidv4()

    // Create email fulfillment
    await query(`
      INSERT INTO boulevard_gift_card_fulfillments 
      (id, cart_item_id, fulfillment_type, sender_name, message_from_sender, 
       recipient_name, recipient_email, delivery_date)
      VALUES ($1, $2, 'email', $3, $4, $5, $6, $7)
    `, [fulfillmentId, cart_item_id, senderName, messageFromSender, recipientName, recipientEmail, deliveryDate])

    res.json({
      data: {
        createCartGiftCardItemEmailFulfillment: {
          cart: {
            selectedItems: [{
              __typename: "CartGiftCardItem",
              id: gift_card_uuid,
              giftCardDesign: {
                id: null,
                image: null,
                backgroundColor: "#FFFFFF",
                foregroundText: "#000000"
              },
              emailFulfillment: {
                id: fulfillmentId,
                senderName,
                messageFromSender,
                recipientName,
                recipientEmail,
                deliveryDate
              }
            }]
          },
          emailFulfillment: {
            id: fulfillmentId,
            senderName,
            messageFromSender,
            recipientName,
            recipientEmail,
            deliveryDate
          }
        }
      }
    })
  } catch (error) {
    console.error('Error creating gift card fulfillment:', error)
    res.status(500).json({ error: 'Failed to create gift card fulfillment' })
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

// Add card payment method (matches book3.txt and book4.txt specification)
router.post('/add-cart-card-payment-method', async (req, res) => {
  try {
    const { input } = req.body
    const { id: cartUuid, token, select = false } = input

    if (!cartUuid || !token) {
      return res.status(400).json({ error: 'Cart ID and token are required' })
    }

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

// Get business gift card settings
router.get('/business/gift-card-settings', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        b.id,
        b.name,
        json_agg(
          json_build_object(
            'id', gcd.id,
            'design', json_build_object(
              'id', gcd.id,
              'name', gcd.name,
              'foregroundText', gcd.foreground_text,
              'backgroundColor', gcd.background_color,
              'image', gcd.image_url
            ),
            'selected', gcd.is_selected
          )
        ) as gift_card_designs
      FROM boulevard_businesses b
      LEFT JOIN boulevard_gift_card_designs gcd ON b.id = gcd.business_id
      WHERE b.id = 1
      GROUP BY b.id, b.name
    `)

    const business = result.rows[0]

    res.json({
      data: {
        business: {
          id: business.id.toString(),
          name: business.name,
          onlineGiftCardSettings: {
            giftCardDesigns: business.gift_card_designs || []
          }
        }
      }
    })
  } catch (error) {
    console.error('Error fetching gift card settings:', error)
    res.status(500).json({ error: 'Failed to fetch gift card settings' })
  }
})

// Update gift card item with design
router.post('/cart/update-gift-card-item', async (req, res) => {
  try {
    const { id: cartUuid, itemId, giftCardDesignId } = req.body

    if (!cartUuid || !itemId || !giftCardDesignId) {
      return res.status(400).json({ error: 'Cart ID, item ID, and design ID are required' })
    }

    // Update gift card item with design
    const updateResult = await query(`
      UPDATE boulevard_cart_items 
      SET gift_card_design_id = $3
      FROM boulevard_carts c
      WHERE boulevard_cart_items.cart_id = c.id 
        AND c.cart_uuid = $1 
        AND boulevard_cart_items.gift_card_uuid = $2
      RETURNING boulevard_cart_items.gift_card_uuid
    `, [cartUuid, itemId, giftCardDesignId])

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Gift card item not found' })
    }

    // Get updated design info
    const designResult = await query(`
      SELECT id, name, foreground_text, background_color, image_url
      FROM boulevard_gift_card_designs
      WHERE id = $1
    `, [giftCardDesignId])

    const design = designResult.rows[0]

    res.json({
      data: {
        updateCartSelectedGiftCardItem: {
          cart: {
            selectedItem: {
              id: itemId,
              giftCardDesign: {
                id: design.id,
                image: design.image_url,
                backgroundColor: design.background_color,
                foregroundText: design.foreground_text
              }
            }
          }
        }
      }
    })
  } catch (error) {
    console.error('Error updating gift card item:', error)
    res.status(500).json({ error: 'Failed to update gift card item' })
  }
})

// Get available booking dates for cart
router.get('/cart/:cartId/bookable-dates', async (req, res) => {
  try {
    const { cartId } = req.params
    const { 
      limit = 31, 
      locationId, 
      searchRangeLower, 
      searchRangeUpper, 
      staffVariantIds, 
      tz 
    } = req.query

    // Get cart location if not provided
    let targetLocationId = locationId
    if (!targetLocationId) {
      const cartResult = await query(`
        SELECT location_id FROM boulevard_carts WHERE cart_uuid = $1
      `, [cartId])
      
      if (cartResult.rows.length === 0) {
        return res.status(404).json({ error: 'Cart not found' })
      }
      targetLocationId = cartResult.rows[0].location_id
    }

    // Calculate date range
    const today = new Date()
    const lowerBound = searchRangeLower ? new Date(searchRangeLower) : today
    const upperBound = searchRangeUpper ? new Date(searchRangeUpper) : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Get available dates from bookable times
    const datesResult = await query(`
      SELECT DISTINCT DATE(start_time) as available_date
      FROM boulevard_bookable_times bt
      WHERE bt.location_id = $1 
        AND bt.is_available = true
        AND DATE(bt.start_time) >= $2
        AND DATE(bt.start_time) <= $3
        AND EXTRACT(dow FROM bt.start_time) NOT IN (0, 6)
      ORDER BY available_date
      LIMIT $4
    `, [targetLocationId, lowerBound.toISOString().split('T')[0], upperBound.toISOString().split('T')[0], limit])

    const dates = datesResult.rows.map(row => ({
      date: row.available_date
    }))

    res.json({
      data: {
        cartBookableDates: dates
      }
    })
  } catch (error) {
    console.error('Error fetching bookable dates:', error)
    res.status(500).json({ error: 'Failed to fetch bookable dates' })
  }
})

// Get client appointments (requires authentication)
router.get('/my-appointments', async (req, res) => {
  try {
    const { first = 20, query: filterQuery } = req.query
    
    // In a real implementation, you'd extract client ID from authenticated token
    // For demo purposes, we'll use a placeholder
    const clientId = req.headers['x-client-id'] || '1'

    let whereClause = 'WHERE a.client_id = $1'
    const params = [clientId]
    
    if (filterQuery) {
      // Parse filter query (simplified implementation)
      if (filterQuery.includes('startAt <=')) {
        const dateMatch = filterQuery.match(/'([^']+)'/);
        if (dateMatch) {
          whereClause += ' AND a.start_at <= $2'
          params.push(dateMatch[1])
        }
      }
      if (filterQuery.includes('locationId =')) {
        const locationMatch = filterQuery.match(/locationId = '([^']+)'/);
        if (locationMatch) {
          whereClause += ` AND a.location_id = $${params.length + 1}`
          params.push(locationMatch[1].replace('urn:blvd:Location:', ''))
        }
      }
    }

    const appointmentsResult = await query(`
      SELECT 
        a.id,
        a.start_at,
        a.end_at,
        a.duration,
        a.cancelled,
        a.state,
        a.client_id,
        a.notes,
        c.first_name as client_first_name,
        c.last_name as client_last_name,
        l.id as location_id,
        l.name as location_name,
        b.name as business_name
      FROM boulevard_appointments a
      LEFT JOIN boulevard_clients c ON a.client_id = c.id
      LEFT JOIN boulevard_locations l ON a.location_id = l.id
      LEFT JOIN boulevard_businesses b ON l.business_id = b.id
      ${whereClause}
      ORDER BY a.start_at DESC
      LIMIT $${params.length + 1}
    `, [...params, first])

    const appointments = appointmentsResult.rows.map(row => ({
      node: {
        id: `urn:blvd:Appointment:${row.id}`,
        startAt: row.start_at,
        endAt: row.end_at,
        duration: row.duration,
        cancelled: row.cancelled,
        state: row.state || 'FINAL',
        clientId: `urn:blvd:Client:${row.client_id}`,
        client: {
          id: `urn:blvd:Client:${row.client_id}`,
          name: `${row.client_first_name} ${row.client_last_name}`
        },
        location: {
          id: `urn:blvd:Location:${row.location_id}`,
          name: row.location_name,
          businessName: row.business_name
        },
        notes: row.notes || '',
        appointmentServices: [] // Would need additional query for services
      }
    }))

    res.json({
      data: {
        myAppointments: {
          edges: appointments
        }
      }
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    res.status(500).json({ error: 'Failed to fetch appointments' })
  }
})

// Get client memberships (requires authentication)
router.get('/my-memberships', async (req, res) => {
  try {
    const { first = 10 } = req.query
    
    // In a real implementation, you'd extract client ID from authenticated token
    const clientId = req.headers['x-client-id'] || '1'

    const membershipsResult = await query(`
      SELECT 
        m.id,
        m.term_number,
        m.start_on,
        m.end_on,
        m.client_id,
        m.status,
        m.name,
        c.first_name,
        c.last_name
      FROM boulevard_memberships m
      LEFT JOIN boulevard_clients c ON m.client_id = c.id
      WHERE m.client_id = $1
      ORDER BY m.start_on DESC
      LIMIT $2
    `, [clientId, first])

    const memberships = membershipsResult.rows.map((row, index) => ({
      cursor: Buffer.from(`arrayconnection:${index}`).toString('base64'),
      node: {
        termNumber: row.term_number,
        startOn: row.start_on,
        endOn: row.end_on,
        clientId: `urn:blvd:Client:${row.client_id}`,
        client: {
          firstName: row.first_name,
          lastName: row.last_name
        },
        status: row.status || 'ACTIVE',
        name: row.name,
        vouchers: [] // Would need additional query for vouchers
      }
    }))

    res.json({
      data: {
        myMemberships: {
          edges: memberships
        }
      }
    })
  } catch (error) {
    console.error('Error fetching memberships:', error)
    res.status(500).json({ error: 'Failed to fetch memberships' })
  }
})

export default router
