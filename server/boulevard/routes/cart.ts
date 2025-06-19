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

// Add purchasable item to cart
router.post('/cart/add-purchasable-item', async (req, res) => {
  try {
    const { id: cartUuid, itemId } = req.body

    if (!cartUuid || !itemId) {
      return res.status(400).json({ error: 'Cart ID and item ID are required' })
    }

    // Extract service ID from URN
    const serviceId = itemId.replace('urn:blvd:Service:', '')

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

// Add gift card item to cart
router.post('/cart/add-gift-card-item', async (req, res) => {
  try {
    const { id: cartUuid, itemId, itemPrice } = req.body

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

// Create gift card email fulfillment
router.post('/cart/create-gift-card-email-fulfillment', async (req, res) => {
  try {
    const { 
      id: cartUuid, 
      itemId, 
      messageFromSender, 
      senderName, 
      recipientEmail, 
      recipientName, 
      deliveryDate 
    } = req.body

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

export default router
