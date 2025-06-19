import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'

import { connectDatabase } from './config/database.js'
import authRoutes from './routes/auth.js'
import businessRoutes from './routes/business.js'
import clientRoutes from './routes/clients.js'
import serviceRoutes from './routes/services.js'
import staffRoutes from './routes/staff.js'
import appointmentRoutes from './routes/appointments.js'
import { authenticateToken } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:5173", // Vite default port
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ],
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 5000

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:5173", // Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/api/', limiter)

// Add preflight handling
app.options('*', cors())

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Add a test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/business', authenticateToken, businessRoutes)
app.use('/api/clients', authenticateToken, clientRoutes)
app.use('/api/services', authenticateToken, serviceRoutes)
app.use('/api/staff', authenticateToken, staffRoutes)
app.use('/api/appointments', authenticateToken, appointmentRoutes)

// Error handling
app.use(errorHandler)

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('join-business', (businessId) => {
    socket.join(`business-${businessId}`)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Make io available to routes
app.set('io', io)

// Start server
const startServer = async () => {
  try {
    await connectDatabase()
    console.log('Database connected successfully')
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`)
      console.log(`API available at http://localhost:${PORT}/api`)
      console.log(`Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
