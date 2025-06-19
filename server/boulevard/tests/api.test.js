import { describe, it, before, after } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import { query } from '../../../src/config/database.js'

// Test against the actual running server
const BASE_URL = 'http://localhost:8000'

// Helper function to make requests to the actual server
const api = {
  get: (path) => request(BASE_URL).get(path),
  post: (path) => request(BASE_URL).post(path)
}

describe('Boulevard API Integration Tests', () => {
  let cartId = null
  let guestId = null

  before(async () => {
    console.log('🧪 Starting Boulevard API Integration Tests')
    console.log('📡 Testing against server at:', BASE_URL)
    
    // Test server connectivity
    try {
      await api.get('/api/boulevard/business/locations').expect(200)
      console.log('✅ Server is running and accessible')
    } catch (error) {
      console.error('❌ Server is not accessible. Make sure it\'s running on localhost:8000')
      throw error
    }
  })

  after(async () => {
    console.log('🧹 Cleaning up test data...')
    // Note: In a real integration test, you might want to clean up test data
    // For now, we'll let the test data remain for inspection
    if (cartId) {
      console.log(`📝 Test cart created: ${cartId}`)
    }
  })

  describe('Locations API Integration', () => {
    it('should get business locations from database', async () => {
      const res = await api.get('/api/boulevard/business/locations')
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('business')
      expect(res.body.data.business).to.have.property('locations')
      expect(res.body.data.business.locations).to.have.property('edges')
      expect(res.body.data.business.locations.edges).to.be.an('array')
      expect(res.body.data.business.locations.edges.length).to.be.greaterThan(0)

      const location = res.body.data.business.locations.edges[0].node
      expect(location).to.have.property('id')
      expect(location).to.have.property('name')
      expect(location).to.have.property('tz')
      expect(location).to.have.property('address')
      
      // Verify location data structure
      expect(location.name).to.be.a('string')
      expect(location.tz).to.be.a('string')
      expect(location.address).to.have.property('line1')
      expect(location.address).to.have.property('city')
      expect(location.address).to.have.property('state')
      expect(location.address).to.have.property('zip')
    })

    it('should limit locations with first parameter', async () => {
      const res = await api.get('/api/boulevard/business/locations?first=1')
        .expect(200)

      expect(res.body.data.business.locations.edges).to.have.length(1)
    })

    it('should return valid timezone and address data', async () => {
      const res = await api.get('/api/boulevard/business/locations')
        .expect(200)

      const location = res.body.data.business.locations.edges[0].node
      expect(location.tz).to.match(/^[A-Za-z_]+\/[A-Za-z_]+$/) // timezone format
      expect(location.address.line1).to.be.a('string')
      expect(location.address.city).to.be.a('string')
      expect(location.address.state).to.be.a('string')
      expect(location.address.zip).to.be.a('string')
    })
  })

  describe('Cart API Integration', () => {
    it('should create a new cart with real database data', async () => {
      const res = await api.post('/api/boulevard/cart/create')
        .send({ locationId: 1 })
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('createCart')
      expect(res.body.data.createCart).to.have.property('cart')

      const cart = res.body.data.createCart.cart
      expect(cart).to.have.property('id')
      expect(cart.id).to.include('urn:blvd:Cart:')
      expect(cart).to.have.property('features')
      expect(cart).to.have.property('availableCategories')
      expect(cart.availableCategories).to.be.an('array')
      expect(cart.availableCategories.length).to.be.greaterThan(0)

      // Store cart ID for subsequent tests
      cartId = cart.id
      console.log(`🛒 Created test cart: ${cartId}`)

      // Verify categories have services
      cart.availableCategories.forEach(category => {
        expect(category).to.have.property('name')
        expect(category).to.have.property('availableItems')
        expect(category.availableItems).to.be.an('array')
        
        category.availableItems.forEach(item => {
          expect(item).to.have.property('id')
          expect(item).to.have.property('name')
          expect(item).to.have.property('__typename')
          expect(item.id).to.include('urn:blvd:Service:')
        })
      })
    })

    it('should fail to create cart without locationId', async () => {
      const res = await api.post('/api/boulevard/cart/create')
        .send({})
        .expect(400)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('locationId is required')
    })

    it('should handle invalid locationId gracefully', async () => {
      const res = await api.post('/api/boulevard/cart/create')
        .send({ locationId: 999 })
        .expect(404)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('Location not found')
    })

    it('should get cart item details from database', async () => {
      const serviceId = 'urn:blvd:Service:1'
      const res = await api.get(`/api/boulevard/cart/${cartId}/item/${serviceId}`)
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('cart')
      expect(res.body.data.cart).to.have.property('availableItem')

      const item = res.body.data.cart.availableItem
      expect(item).to.have.property('id', serviceId)
      expect(item).to.have.property('name')
      expect(item).to.have.property('description')
      expect(item).to.have.property('staffVariants')
      expect(item.staffVariants).to.be.an('array')
      expect(item.staffVariants.length).to.be.greaterThan(0)

      const variant = item.staffVariants[0]
      expect(variant).to.have.property('id')
      expect(variant).to.have.property('price')
      expect(variant).to.have.property('duration')
      expect(variant).to.have.property('staff')
      
      // Verify staff details
      expect(variant.staff).to.have.property('firstName')
      expect(variant.staff).to.have.property('lastName')
      expect(variant.staff).to.have.property('bio')
      expect(variant.price).to.be.a('number')
      expect(variant.duration).to.be.a('number')
    })

    it('should add bookable item to cart in database', async () => {
      const res = await api.post('/api/boulevard/cart/add-bookable-item')
        .send({
          id: cartId,
          itemId: 'urn:blvd:Service:1',
          itemStaffVariantId: 1
        })
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('addCartSelectedBookableItem')
      expect(res.body.data.addCartSelectedBookableItem).to.have.property('cart')
      expect(res.body.data.addCartSelectedBookableItem.cart.id).to.equal(cartId)
      
      console.log('✅ Added service to cart successfully')
    })

    it('should update cart with client information in database', async () => {
      const clientInfo = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '555-1234'
      }

      const res = await api.post('/api/boulevard/cart/update')
        .send({
          id: cartId,
          clientInformation: clientInfo
        })
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('updateCart')
      expect(res.body.data.updateCart).to.have.property('cart')
      expect(res.body.data.updateCart.cart.id).to.equal(cartId)
      
      console.log('✅ Updated cart with client information')
    })

    it('should create cart guest in database', async () => {
      const guestInfo = {
        id: cartId,
        email: 'guest@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '555-5678'
      }

      const res = await api.post('/api/boulevard/create-cart-guest')
        .send(guestInfo)
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('createCartGuest')
      expect(res.body.data.createCartGuest).to.have.property('cart')

      const cart = res.body.data.createCartGuest.cart
      expect(cart.id).to.equal(cartId)
      expect(cart).to.have.property('guests')
      expect(cart.guests).to.be.an('array')
      expect(cart.guests.length).to.be.greaterThan(0)

      // Store guest ID for subsequent tests
      guestId = cart.guests[0].id
      
      // Verify guest data structure
      const guest = cart.guests[0]
      expect(guest).to.have.property('id')
      expect(guest).to.have.property('first_name', guestInfo.firstName)
      expect(guest).to.have.property('last_name', guestInfo.lastName)
      expect(guest).to.have.property('email', guestInfo.email)
      
      console.log(`👥 Created guest: ${guest.first_name} ${guest.last_name}`)
    })

    it('should add card payment method to database', async () => {
      const res = await api.post('/api/boulevard/add-cart-card-payment-method')
        .send({
          id: cartId,
          token: 'test_token_123',
          select: true
        })
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('addCartCardPaymentMethod')
      expect(res.body.data.addCartCardPaymentMethod).to.have.property('cart')
      expect(res.body.data.addCartCardPaymentMethod.cart.id).to.equal(cartId)
      
      console.log('💳 Added payment method to cart')
    })

    it('should checkout cart and update database', async () => {
      const res = await api.post('/api/boulevard/checkout-cart')
        .send({ id: cartId })
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('checkoutCart')
      expect(res.body.data.checkoutCart).to.have.property('cart')

      const cart = res.body.data.checkoutCart.cart
      expect(cart.id).to.equal(cartId)
      expect(cart).to.have.property('completedAt')
      expect(cart.completedAt).to.be.a('string')
      
      // Verify timestamp format
      const completedAt = new Date(cart.completedAt)
      expect(completedAt).to.be.a('date')
      expect(completedAt.getTime()).to.be.greaterThan(Date.now() - 10000) // Within last 10 seconds
      
      console.log(`✅ Cart checked out at: ${cart.completedAt}`)
    })
  })

  describe('Error Handling with Database', () => {
    it('should handle non-existent service from database', async () => {
      const res = await api.get(`/api/boulevard/cart/${cartId}/item/urn:blvd:Service:999`)
        .expect(404)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('Service not found')
    })

    it('should handle invalid staff variant from database', async () => {
      const res = await api.post('/api/boulevard/cart/add-bookable-item')
        .send({
          id: cartId,
          itemId: 'urn:blvd:Service:1',
          itemStaffVariantId: 999
        })
        .expect(404)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('Staff variant not found')
    })

    it('should handle database constraint violations gracefully', async () => {
      // Try to create a guest with invalid cart
      const res = await api.post('/api/boulevard/create-cart-guest')
        .send({
          id: 'urn:blvd:Cart:invalid-uuid',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          phoneNumber: '555-0000'
        })
        .expect(404)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('Cart not found')
    })

    it('should validate required fields', async () => {
      const res = await api.post('/api/boulevard/cart/add-bookable-item')
        .send({
          id: cartId,
          // Missing itemId
          itemStaffVariantId: 1
        })
        .expect(500) // Server error due to missing required field

      expect(res.body).to.have.property('error')
    })
  })

  describe('Performance and Load', () => {
    it('should handle multiple concurrent requests', async () => {
      const promises = []
      
      // Create multiple carts concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(
          api.post('/api/boulevard/cart/create')
            .send({ locationId: 1 })
            .expect(200)
        )
      }
      
      const results = await Promise.all(promises)
      
      // Verify all carts were created with unique IDs
      const cartIds = results.map(res => res.body.data.createCart.cart.id)
      const uniqueIds = new Set(cartIds)
      expect(uniqueIds.size).to.equal(cartIds.length)
      
      console.log(`🚀 Created ${cartIds.length} concurrent carts successfully`)
    })
  })

  describe('New Endpoints Integration Tests', () => {
    let testCartId = null
    let giftCardId = null

    before(async () => {
      // Create a test cart for the new endpoint tests
      const cartRes = await api.post('/api/boulevard/cart/create')
        .send({ locationId: 1 })
        .expect(200)
      
      testCartId = cartRes.body.data.createCart.cart.id
      console.log(`🛒 Created test cart for new endpoints: ${testCartId}`)
    })

    describe('1. Add Purchasable Item Integration', () => {
      it('should add purchasable item to cart with input wrapper', async () => {
        const res = await api.post('/api/boulevard/cart/add-purchasable-item')
          .send({
            input: {
              id: testCartId,
              itemId: 'urn:blvd:Service:11'
            }
          })
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('addCartSelectedPurchasableItem')
        expect(res.body.data.addCartSelectedPurchasableItem.cart.id).to.equal(testCartId)
        
        // Verify item was added to database
        const dbResult = await query(`
          SELECT ci.*, s.name as service_name
          FROM boulevard_cart_items ci
          JOIN boulevard_carts c ON ci.cart_id = c.id
          JOIN boulevard_services s ON ci.service_id = s.id
          WHERE c.cart_uuid = $1 AND ci.item_type = 'purchasable'
        `, [testCartId])
        
        expect(dbResult.rows.length).to.be.greaterThan(0)
        expect(dbResult.rows[0].service_name).to.equal('Jentlemanicure Membership')
        
        console.log('✅ Successfully added purchasable item to cart')
      })

      it('should handle ProductLocation URN format', async () => {
        const res = await api.post('/api/boulevard/cart/add-purchasable-item')
          .send({
            input: {
              id: testCartId,
              itemId: 'urn:blvd:ProductLocation:12'
            }
          })
          .expect(200)

        expect(res.body.data.addCartSelectedPurchasableItem.cart.id).to.equal(testCartId)
      })

      it('should fail with missing input wrapper', async () => {
        const res = await api.post('/api/boulevard/cart/add-purchasable-item')
          .send({
            id: testCartId,
            itemId: 'urn:blvd:Service:11'
          })
          .expect(500)

        expect(res.body).to.have.property('error')
      })

      it('should validate non-existent purchasable item', async () => {
        const res = await api.post('/api/boulevard/cart/add-purchasable-item')
          .send({
            input: {
              id: testCartId,
              itemId: 'urn:blvd:Service:999'
            }
          })
          .expect(404)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Purchasable item not found')
      })
    })

    describe('2. Add Gift Card Item Integration', () => {
      it('should add gift card item with price', async () => {
        const res = await api.post('/api/boulevard/cart/add-gift-card-item')
          .send({
            input: {
              id: testCartId,
              itemId: 'GIFT_CARD',
              itemPrice: 5000
            }
          })
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('addCartSelectedGiftCardItem')
        expect(res.body.data.addCartSelectedGiftCardItem.cart.id).to.equal(testCartId)
        
        // Extract gift card ID from database for later tests
        const dbResult = await query(`
          SELECT gift_card_uuid FROM boulevard_cart_items ci
          JOIN boulevard_carts c ON ci.cart_id = c.id
          WHERE c.cart_uuid = $1 AND ci.item_type = 'gift_card'
          ORDER BY ci.id DESC LIMIT 1
        `, [testCartId])
        
        expect(dbResult.rows.length).to.equal(1)
        expect(dbResult.rows[0].gift_card_uuid).to.include('urn:blvd:GiftCard:')
        giftCardId = dbResult.rows[0].gift_card_uuid
        
        console.log('🎁 Successfully added gift card item to cart')
      })

      it('should validate required price field', async () => {
        const res = await api.post('/api/boulevard/cart/add-gift-card-item')
          .send({
            input: {
              id: testCartId,
              itemId: 'GIFT_CARD'
              // Missing itemPrice
            }
          })
          .expect(400)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.include('price')
      })

      it('should store correct price in database', async () => {
        const testPrice = 7500
        await api.post('/api/boulevard/cart/add-gift-card-item')
          .send({
            input: {
              id: testCartId,
              itemId: 'GIFT_CARD',
              itemPrice: testPrice
            }
          })
          .expect(200)

        const dbResult = await query(`
          SELECT gift_card_price FROM boulevard_cart_items ci
          JOIN boulevard_carts c ON ci.cart_id = c.id
          WHERE c.cart_uuid = $1 AND ci.item_type = 'gift_card'
          ORDER BY ci.id DESC LIMIT 1
        `, [testCartId])
        
        expect(dbResult.rows[0].gift_card_price).to.equal(testPrice)
      })
    })

    describe('3. Gift Card Email Fulfillment Integration', () => {
      it('should create email fulfillment for gift card', async () => {
        const fulfillmentData = {
          input: {
            id: testCartId,
            itemId: giftCardId,
            messageFromSender: 'Happy Birthday!',
            senderName: 'John',
            recipientEmail: 'jane@example.com',
            recipientName: 'Jane',
            deliveryDate: '2025-12-25'
          }
        }

        const res = await api.post('/api/boulevard/cart/create-gift-card-email-fulfillment')
          .send(fulfillmentData)
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('createCartGiftCardItemEmailFulfillment')
        
        const fulfillment = res.body.data.createCartGiftCardItemEmailFulfillment
        expect(fulfillment.cart.selectedItems).to.be.an('array')
        expect(fulfillment.cart.selectedItems[0]).to.have.property('emailFulfillment')
        expect(fulfillment.emailFulfillment.senderName).to.equal('John')
        expect(fulfillment.emailFulfillment.recipientEmail).to.equal('jane@example.com')
        
        // Verify fulfillment was stored in database
        const dbResult = await query(`
          SELECT * FROM boulevard_gift_card_fulfillments gcf
          JOIN boulevard_cart_items ci ON gcf.cart_item_id = ci.id
          JOIN boulevard_carts c ON ci.cart_id = c.id
          WHERE c.cart_uuid = $1 AND gcf.recipient_email = $2
        `, [testCartId, 'jane@example.com'])
        
        expect(dbResult.rows.length).to.equal(1)
        expect(dbResult.rows[0].sender_name).to.equal('John')
        expect(dbResult.rows[0].message_from_sender).to.equal('Happy Birthday!')
        
        console.log('📧 Successfully created gift card email fulfillment')
      })

      it('should validate required fulfillment fields', async () => {
        const res = await api.post('/api/boulevard/cart/create-gift-card-email-fulfillment')
          .send({
            input: {
              id: testCartId,
              itemId: giftCardId
              // Missing recipientEmail
            }
          })
          .expect(400)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.include('recipient email')
      })

      it('should handle non-existent gift card', async () => {
        const res = await api.post('/api/boulevard/cart/create-gift-card-email-fulfillment')
          .send({
            input: {
              id: testCartId,
              itemId: 'urn:blvd:GiftCard:nonexistent',
              recipientEmail: 'test@example.com'
            }
          })
          .expect(404)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.include('Gift card item not found')
      })
    })

    describe('4. Add Card Payment Method Integration', () => {
      it('should add card payment method with input wrapper', async () => {
        const res = await api.post('/api/boulevard/add-cart-card-payment-method')
          .send({
            input: {
              id: testCartId,
              token: 'test_token_456',
              select: true
            }
          })
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('addCartCardPaymentMethod')
        expect(res.body.data.addCartCardPaymentMethod.cart.id).to.equal(testCartId)
        
        // Verify payment method was stored in database
        const dbResult = await query(`
          SELECT * FROM boulevard_payment_methods pm
          JOIN boulevard_carts c ON pm.cart_id = c.id
          WHERE c.cart_uuid = $1 AND pm.token = $2
        `, [testCartId, 'test_token_456'])
        
        expect(dbResult.rows.length).to.equal(1)
        expect(dbResult.rows[0].is_selected).to.equal(true)
        expect(dbResult.rows[0].method_type).to.equal('card')
        
        console.log('💳 Successfully added card payment method')
      })

      it('should unselect other payment methods when select is true', async () => {
        // Add another payment method
        await api.post('/api/boulevard/add-cart-card-payment-method')
          .send({
            input: {
              id: testCartId,
              token: 'test_token_789',
              select: true
            }
          })
          .expect(200)

        // Verify only the latest one is selected
        const dbResult = await query(`
          SELECT token, is_selected FROM boulevard_payment_methods pm
          JOIN boulevard_carts c ON pm.cart_id = c.id
          WHERE c.cart_uuid = $1
          ORDER BY pm.id
        `, [testCartId])
        
        expect(dbResult.rows.length).to.equal(2)
        expect(dbResult.rows[0].is_selected).to.equal(false) // First one unselected
        expect(dbResult.rows[1].is_selected).to.equal(true)  // Second one selected
      })

      it('should handle missing token', async () => {
        const res = await api.post('/api/boulevard/add-cart-card-payment-method')
          .send({
            input: {
              id: testCartId,
              select: true
              // Missing token
            }
          })
          .expect(400)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.include('token')
      })
    })

    describe('5. Cart Bookable Dates Integration', () => {
      it('should get available booking dates for cart', async () => {
        const res = await api.get(`/api/boulevard/cart/${testCartId}/bookable-dates`)
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('cartBookableDates')
        expect(res.body.data.cartBookableDates).to.be.an('array')
        expect(res.body.data.cartBookableDates.length).to.be.greaterThan(0)
        
        // Verify date format
        const firstDate = res.body.data.cartBookableDates[0]
        expect(firstDate).to.have.property('date')
        expect(new Date(firstDate.date)).to.be.a('date')
        
        console.log(`📅 Found ${res.body.data.cartBookableDates.length} available booking dates`)
      })

      it('should respect limit parameter', async () => {
        const res = await api.get(`/api/boulevard/cart/${testCartId}/bookable-dates?limit=3`)
          .expect(200)

        expect(res.body.data.cartBookableDates.length).to.be.lessThanOrEqual(3)
      })

      it('should handle date range parameters', async () => {
        const lowerBound = '2025-06-25'
        const upperBound = '2025-06-30'
        
        const res = await api.get(`/api/boulevard/cart/${testCartId}/bookable-dates?searchRangeLower=${lowerBound}&searchRangeUpper=${upperBound}`)
          .expect(200)

        // Verify all dates are within range
        res.body.data.cartBookableDates.forEach(dateObj => {
          const date = new Date(dateObj.date)
          expect(date).to.be.at.least(new Date(lowerBound))
          expect(date).to.be.at.most(new Date(upperBound))
        })
      })

      it('should handle non-existent cart', async () => {
        const res = await api.get('/api/boulevard/cart/urn:blvd:Cart:nonexistent/bookable-dates')
          .expect(404)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Cart not found')
      })

      it('should exclude weekends from available dates', async () => {
        const res = await api.get(`/api/boulevard/cart/${testCartId}/bookable-dates`)
          .expect(200)

        // Verify no weekend dates (Saturday = 6, Sunday = 0)
        res.body.data.cartBookableDates.forEach(dateObj => {
          const date = new Date(dateObj.date)
          const dayOfWeek = date.getDay()
          expect(dayOfWeek).to.not.be.oneOf([0, 6])
        })
      })
    })

    describe('6. Business Gift Card Settings Integration', () => {
      it('should get gift card designs from database', async () => {
        const res = await api.get('/api/boulevard/business/gift-card-settings')
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('business')
        expect(res.body.data.business).to.have.property('onlineGiftCardSettings')
        
        const settings = res.body.data.business.onlineGiftCardSettings
        expect(settings).to.have.property('giftCardDesigns')
        expect(settings.giftCardDesigns).to.be.an('array')
        expect(settings.giftCardDesigns.length).to.be.greaterThan(0)
        
        // Verify design structure
        const firstDesign = settings.giftCardDesigns[0]
        expect(firstDesign).to.have.property('id')
        expect(firstDesign).to.have.property('design')
        expect(firstDesign.design).to.have.property('name')
        expect(firstDesign.design).to.have.property('backgroundColor')
        expect(firstDesign.design).to.have.property('foregroundText')
        expect(firstDesign.design).to.have.property('image')
        
        // Verify data matches database
        const dbResult = await query(`
          SELECT COUNT(*) as count FROM boulevard_gift_card_designs WHERE business_id = 1
        `)
        expect(settings.giftCardDesigns.length).to.equal(parseInt(dbResult.rows[0].count))
        
        console.log(`🎨 Found ${settings.giftCardDesigns.length} gift card designs`)
      })

      it('should return business information', async () => {
        const res = await api.get('/api/boulevard/business/gift-card-settings')
          .expect(200)

        expect(res.body.data.business).to.have.property('id')
        expect(res.body.data.business).to.have.property('name')
        expect(res.body.data.business.name).to.equal('The Jentleman Salon')
      })
    })

    describe('7. My Appointments Integration', () => {
      it('should get client appointments from database', async () => {
        const res = await api.get('/api/boulevard/my-appointments')
          .set('x-client-id', '1')
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('myAppointments')
        expect(res.body.data.myAppointments).to.have.property('edges')
        expect(res.body.data.myAppointments.edges).to.be.an('array')
        
        if (res.body.data.myAppointments.edges.length > 0) {
          const appointment = res.body.data.myAppointments.edges[0].node
          expect(appointment).to.have.property('id')
          expect(appointment).to.have.property('startAt')
          expect(appointment).to.have.property('endAt')
          expect(appointment).to.have.property('duration')
          expect(appointment).to.have.property('cancelled')
          expect(appointment).to.have.property('state')
          expect(appointment).to.have.property('client')
          expect(appointment).to.have.property('location')
          expect(appointment).to.have.property('appointmentServices')
          expect(appointment.id).to.include('urn:blvd:Appointment:')
          
          // Verify data structure
          expect(appointment.client).to.have.property('name')
          expect(appointment.location).to.have.property('businessName')
          expect(appointment.appointmentServices).to.be.an('array')
          
          console.log(`📅 Found ${res.body.data.myAppointments.edges.length} appointments`)
        }
      })

      it('should respect pagination limit', async () => {
        const res = await api.get('/api/boulevard/my-appointments?first=1')
          .set('x-client-id', '1')
          .expect(200)

        expect(res.body.data.myAppointments.edges.length).to.be.lessThanOrEqual(1)
      })

      it('should handle query filters', async () => {
        const filterQuery = "startAt <= '2025-12-31T00:00:00-07:00'"
        const res = await api.get(`/api/boulevard/my-appointments?query=${encodeURIComponent(filterQuery)}`)
          .set('x-client-id', '1')
          .expect(200)

        expect(res.body.data.myAppointments.edges).to.be.an('array')
      })

      it('should handle location filter', async () => {
        const filterQuery = "locationId = 'urn:blvd:Location:1'"
        const res = await api.get(`/api/boulevard/my-appointments?query=${encodeURIComponent(filterQuery)}`)
          .set('x-client-id', '1')
          .expect(200)

        expect(res.body.data.myAppointments.edges).to.be.an('array')
      })

      it('should use default client ID when header missing', async () => {
        const res = await api.get('/api/boulevard/my-appointments')
          // Missing x-client-id header
          .expect(200)

        expect(res.body.data.myAppointments.edges).to.be.an('array')
      })
    })

    describe('8. My Memberships Integration', () => {
      it('should get client memberships from database', async () => {
        const res = await api.get('/api/boulevard/my-memberships')
          .set('x-client-id', '1')
          .expect(200)

        expect(res.body).to.have.property('data')
        expect(res.body.data).to.have.property('myMemberships')
        expect(res.body.data.myMemberships).to.have.property('edges')
        expect(res.body.data.myMemberships.edges).to.be.an('array')
        
        if (res.body.data.myMemberships.edges.length > 0) {
          const membership = res.body.data.myMemberships.edges[0]
          expect(membership).to.have.property('cursor')
          expect(membership).to.have.property('node')
          
          const node = membership.node
          expect(node).to.have.property('termNumber')
          expect(node).to.have.property('startOn')
          expect(node).to.have.property('endOn')
          expect(node).to.have.property('clientId')
          expect(node).to.have.property('client')
          expect(node).to.have.property('status')
          expect(node).to.have.property('name')
          expect(node).to.have.property('vouchers')
          
          // Verify data structure
          expect(node.client).to.have.property('firstName')
          expect(node.client).to.have.property('lastName')
          expect(node.vouchers).to.be.an('array')
          expect(node.clientId).to.include('urn:blvd:Client:')
          
          console.log(`🎫 Found ${res.body.data.myMemberships.edges.length} memberships`)
        }
      })

      it('should respect pagination limit', async () => {
        const res = await api.get('/api/boulevard/my-memberships?first=1')
          .set('x-client-id', '1')
          .expect(200)

        expect(res.body.data.myMemberships.edges.length).to.be.lessThanOrEqual(1)
      })

      it('should return proper cursor-based pagination', async () => {
        const res = await api.get('/api/boulevard/my-memberships')
          .set('x-client-id', '1')
          .expect(200)

        res.body.data.myMemberships.edges.forEach(edge => {
          expect(edge.cursor).to.be.a('string')
          expect(edge.cursor.length).to.be.greaterThan(0)
          
          // Verify cursor is base64 encoded
          const decoded = Buffer.from(edge.cursor, 'base64').toString()
          expect(decoded).to.include('arrayconnection:')
        })
      })

      it('should validate membership data against database', async () => {
        const res = await api.get('/api/boulevard/my-memberships')
          .set('x-client-id', '1')
          .expect(200)

        if (res.body.data.myMemberships.edges.length > 0) {
          const membership = res.body.data.myMemberships.edges[0].node
          
          // Verify against database
          const dbResult = await query(`
            SELECT * FROM boulevard_memberships WHERE client_id = 1 ORDER BY start_on DESC LIMIT 1
          `)
          
          expect(dbResult.rows.length).to.be.greaterThan(0)
          expect(membership.termNumber).to.equal(dbResult.rows[0].term_number)
          expect(membership.status).to.equal(dbResult.rows[0].status)
          expect(membership.name).to.equal(dbResult.rows[0].name)
        }
      })
    })

    describe('Error Handling for New Endpoints', () => {
      it('should handle invalid cart ID for payment method', async () => {
        const res = await api.post('/api/boulevard/add-cart-card-payment-method')
          .send({
            input: {
              id: 'urn:blvd:Cart:invalid-uuid',
              token: 'test_token',
              select: true
            }
          })
          .expect(404)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Cart not found')
      })

      it('should handle invalid cart for purchasable item', async () => {
        const res = await api.post('/api/boulevard/cart/add-purchasable-item')
          .send({
            input: {
              id: 'urn:blvd:Cart:invalid-uuid',
              itemId: 'urn:blvd:Service:11'
            }
          })
          .expect(404)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Cart not found')
      })

      it('should handle invalid cart for gift card', async () => {
        const res = await api.post('/api/boulevard/cart/add-gift-card-item')
          .send({
            input: {
              id: 'urn:blvd:Cart:invalid-uuid',
              itemId: 'GIFT_CARD',
              itemPrice: 5000
            }
          })
          .expect(404)

        expect(res.body).to.have.property('error')
        expect(res.body.error).to.equal('Cart not found')
      })

      it('should handle missing input wrapper for all new endpoints', async () => {
        const endpoints = [
          { path: '/api/boulevard/cart/add-purchasable-item', data: { id: testCartId, itemId: 'urn:blvd:Service:11' } },
          { path: '/api/boulevard/cart/add-gift-card-item', data: { id: testCartId, itemId: 'GIFT_CARD', itemPrice: 5000 } },
          { path: '/api/boulevard/add-cart-card-payment-method', data: { id: testCartId, token: 'test', select: true } }
        ]

        for (const endpoint of endpoints) {
          const res = await api.post(endpoint.path)
            .send(endpoint.data) // Missing input wrapper
            .expect(500)

          expect(res.body).to.have.property('error')
        }
      })
    })
  })
})
