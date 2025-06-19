import { Router } from 'express'
import locationsRouter from './routes/locations.js'
import cartRouter from './routes/cart.js'
import bookingRouter from './routes/booking.js'
import authRouter from './routes/auth.js'

const router = Router()

// Mount all Boulevard API routes
router.use('/boulevard', locationsRouter)
router.use('/boulevard', cartRouter)
router.use('/boulevard', bookingRouter)
router.use('/boulevard', authRouter)

export default router
