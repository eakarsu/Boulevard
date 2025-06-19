import { Router } from 'express'
import locationsRouter from './routes/locations.js'
import cartRouter from './routes/cart.js'

const router = Router()

// Mount all Boulevard API routes
router.use('/boulevard', locationsRouter)
router.use('/boulevard', cartRouter)

export default router
