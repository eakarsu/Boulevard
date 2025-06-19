import { describe, it, before, after } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import express from 'express'
import cors from 'cors'
import locationsRouter from '../routes/locations.js'
import cartRouter from '../routes/cart.js'

// Create test app
const app = express()
app.use(cors())
app.use(express.json())
app.use('/api/boulevard', locationsRouter)
app.use('/api/boulevard', cartRouter)

describe('Boulevard API Tests', () => {
  let cartId = null
  let guestId = null

  describe('Locations API', () => {
    it('should get business locations', async () => {
      const res = await request(app)
        .get('/api/boulevard/business/locations')
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
    })

    it('should limit locations with first parameter', async () => {
      const res = await request(app)
        .get('/api/boulevard/business/locations?first=1')
        .expect(200)

      expect(res.body.data.business.locations.edges).to.have.length(1)
    })
  })

  describe('Cart API', () => {
    it('should create a new cart', async () => {
      const res = await request(app)
        .post('/api/boulevard/cart/create')
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
    })

    it('should fail to create cart without locationId', async () => {
      const res = await request(app)
        .post('/api/boulevard/cart/create')
        .send({})
        .expect(400)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('locationId is required')
    })

    it('should get cart item details', async () => {
      const serviceId = 'urn:blvd:Service:1'
      const res = await request(app)
        .get(`/api/boulevard/cart/${cartId}/item/${serviceId}`)
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
    })

    it('should add bookable item to cart', async () => {
      const res = await request(app)
        .post('/api/boulevard/cart/add-bookable-item')
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
    })

    it('should update cart with client information', async () => {
      const clientInfo = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '555-1234'
      }

      const res = await request(app)
        .post('/api/boulevard/cart/update')
        .send({
          id: cartId,
          clientInformation: clientInfo
        })
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('updateCart')
      expect(res.body.data.updateCart).to.have.property('cart')
      expect(res.body.data.updateCart.cart.id).to.equal(cartId)
    })

    it('should create cart guest', async () => {
      const guestInfo = {
        id: cartId,
        email: 'guest@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '555-5678'
      }

      const res = await request(app)
        .post('/api/boulevard/create-cart-guest')
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
    })

    it('should add card payment method', async () => {
      const res = await request(app)
        .post('/api/boulevard/add-cart-card-payment-method')
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
    })

    it('should checkout cart', async () => {
      const res = await request(app)
        .post('/api/boulevard/checkout-cart')
        .send({ id: cartId })
        .expect(200)

      expect(res.body).to.have.property('data')
      expect(res.body.data).to.have.property('checkoutCart')
      expect(res.body.data.checkoutCart).to.have.property('cart')

      const cart = res.body.data.checkoutCart.cart
      expect(cart.id).to.equal(cartId)
      expect(cart).to.have.property('completedAt')
      expect(cart.completedAt).to.be.a('string')
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent cart', async () => {
      const fakeCartId = 'urn:blvd:Cart:fake-uuid'
      const res = await request(app)
        .get(`/api/boulevard/cart/${fakeCartId}/item/urn:blvd:Service:1`)
        .expect(200) // Cart endpoint doesn't validate cart existence for item lookup

      // This test verifies the endpoint doesn't crash with invalid cart ID
    })

    it('should handle non-existent service', async () => {
      const res = await request(app)
        .get(`/api/boulevard/cart/${cartId}/item/urn:blvd:Service:999`)
        .expect(404)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('Service not found')
    })

    it('should handle invalid staff variant', async () => {
      const res = await request(app)
        .post('/api/boulevard/cart/add-bookable-item')
        .send({
          id: cartId,
          itemId: 'urn:blvd:Service:1',
          itemStaffVariantId: 999
        })
        .expect(404)

      expect(res.body).to.have.property('error')
      expect(res.body.error).to.equal('Staff variant not found')
    })
  })
})
