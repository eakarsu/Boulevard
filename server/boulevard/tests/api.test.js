import { describe, it, before, after } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'

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
})
