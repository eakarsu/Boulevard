import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
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
      "http://localhost:3000",
      "http://localhost:5173", // Vite default port
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 8000

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173", // Vite default port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Add preflight handling
app.options('*', cors())

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent'),
    authorization: req.get('Authorization') ? 'Present' : 'Missing'
  })
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Add a test endpoint to verify API is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() })
})

// Add a debug endpoint to check database tables
app.get('/api/debug/tables', async (req, res) => {
  try {
    const { query } = await import('./config/database.js')
    
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    const counts = {}
    for (const table of tables.rows) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table.table_name}`)
        counts[table.table_name] = parseInt(result.rows[0].count)
      } catch (error) {
        counts[table.table_name] = 'Error: ' + error.message
      }
    }
    
    res.json({ tables: counts })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Add a debug endpoint to create database schema
app.post('/api/debug/create-schema', async (req, res) => {
  try {
    const { query } = await import('./config/database.js')
    
    // Create tables if they don't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'client',
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        logo TEXT,
        website VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        total_spent DECIMAL(10,2) DEFAULT 0,
        last_visit DATE,
        appointment_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        duration_minutes INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id),
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255),
        skills TEXT[],
        commission_rate DECIMAL(5,2) DEFAULT 0,
        hourly_rate DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(business_id, user_id)
      )
    `)
    
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id),
        client_id INTEGER REFERENCES clients(id),
        staff_id INTEGER REFERENCES staff(id),
        service_id INTEGER REFERENCES services(id),
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        price DECIMAL(10,2),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    res.json({ message: 'Database schema created successfully' })
  } catch (error) {
    console.error('Error creating schema:', error)
    res.status(500).json({ error: error.message })
  }
})

// Add a debug endpoint to create sample data
app.post('/api/debug/seed', async (req, res) => {
  try {
    const { query } = await import('./config/database.js')
    
    // Get existing business owner user and business
    let userResult = await query(`SELECT id FROM users WHERE email = 'john@example.com'`)
    let userId
    let businessId
    
    if (userResult.rows.length === 0) {
      // Create sample user if doesn't exist
      userResult = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
        VALUES ('john@example.com', '$2b$10$defaulthash', 'John', 'Doe', '+1234567890', 'business_owner')
        RETURNING id
      `)
      userId = userResult.rows[0].id
      
      // Create sample business
      const businessResult = await query(`
        INSERT INTO businesses (owner_id, name, description, phone, email)
        VALUES ($1, 'Sample Salon', 'A beautiful salon', '+1234567890', 'salon@example.com')
        RETURNING id
      `, [userId])
      businessId = businessResult.rows[0].id
      
      
      // Create sample services
      await query(`
        INSERT INTO services (business_id, name, description, category, duration_minutes, price, color, is_active)
        VALUES 
          ($1, 'Haircut & Style', 'Professional haircut with wash and style', 'Hair', 60, 85, '#3B82F6', true),
          ($1, 'Color & Highlights', 'Full color service with highlights', 'Hair', 120, 150, '#8B5CF6', true),
          ($1, 'Beard Trim', 'Professional beard trimming', 'Grooming', 30, 35, '#10B981', true)
      `, [businessId])
    } else {
      userId = userResult.rows[0].id
      
      // Get existing business
      const businessResult = await query(`SELECT id FROM businesses WHERE owner_id = $1`, [userId])
      if (businessResult.rows.length > 0) {
        businessId = businessResult.rows[0].id
      } else {
        return res.status(500).json({ error: 'User exists but no business found' })
      }
    }
    
    // Check if staff already exists before creating
    const existingStaff = await query(`SELECT COUNT(*) as count FROM staff WHERE business_id = $1`, [businessId])
    
    if (parseInt(existingStaff.rows[0].count) === 0) {
      // Create sample staff
      const staffUserResult = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
        VALUES ('staff@example.com', '$2b$10$defaulthash', 'Jane', 'Smith', '+1555555555', 'staff')
        ON CONFLICT (email) DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone
        RETURNING id
      `)
      const staffUserId = staffUserResult.rows[0].id
      
      // Check if staff record already exists
      const existingStaffRecord = await query(`
        SELECT id FROM staff WHERE business_id = $1 AND user_id = $2
      `, [businessId, staffUserId])
      
      if (existingStaffRecord.rows.length === 0) {
        await query(`
          INSERT INTO staff (business_id, user_id, title, skills, commission_rate, hourly_rate, is_active)
          VALUES ($1, $2, 'Senior Stylist', ARRAY['Hair Cutting', 'Coloring'], 40, 25, true)
        `, [businessId, staffUserId])
      }
      
      // Create another staff member
      const staffUser2Result = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
        VALUES ('staff2@example.com', '$2b$10$defaulthash', 'Mike', 'Johnson', '+1666666666', 'staff')
        ON CONFLICT (email) DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone
        RETURNING id
      `)
      const staffUser2Id = staffUser2Result.rows[0].id
      
      // Check if staff record already exists
      const existingStaff2Record = await query(`
        SELECT id FROM staff WHERE business_id = $1 AND user_id = $2
      `, [businessId, staffUser2Id])
      
      if (existingStaff2Record.rows.length === 0) {
        await query(`
          INSERT INTO staff (business_id, user_id, title, skills, commission_rate, hourly_rate, is_active)
          VALUES ($1, $2, 'Junior Stylist', ARRAY['Hair Cutting', 'Styling'], 30, 20, true)
        `, [businessId, staffUser2Id])
      }
    }
    
    // Check if clients already exist before creating
    const existingClients = await query(`SELECT COUNT(*) as count FROM clients WHERE business_id = $1`, [businessId])
    
    if (parseInt(existingClients.rows[0].count) === 0) {
      // Create sample clients
      await query(`
        INSERT INTO clients (business_id, first_name, last_name, email, phone, total_spent, last_visit, appointment_count)
        VALUES 
          ($1, 'Sarah', 'Johnson', 'sarah@example.com', '+1111111111', 1250, '2024-06-15', 8),
          ($1, 'Michael', 'Chen', 'michael@example.com', '+2222222222', 890, '2024-06-10', 5),
          ($1, 'Lisa', 'Anderson', 'lisa@example.com', '+3333333333', 2100, '2024-06-08', 12),
          ($1, 'Emma', 'Wilson', 'emma@example.com', '+1444444444', 675, '2024-06-12', 4),
          ($1, 'David', 'Brown', 'david@example.com', '+1555555555', 1890, '2024-06-14', 9),
          ($1, 'Jessica', 'Davis', 'jessica@example.com', '+1666666666', 420, '2024-06-05', 3),
          ($1, 'Ryan', 'Miller', 'ryan@example.com', '+1777777777', 1560, '2024-06-11', 7),
          ($1, 'Ashley', 'Garcia', 'ashley@example.com', '+1888888888', 980, '2024-06-13', 6),
          ($1, 'Kevin', 'Martinez', 'kevin@example.com', '+1999999999', 1340, '2024-06-09', 8),
          ($1, 'Sophia', 'Rodriguez', 'sophia@example.com', '+1000000000', 2250, '2024-06-16', 15)
      `, [businessId])
    }
    
    // Check if appointments already exist before creating
    const existingAppointments = await query(`SELECT COUNT(*) as count FROM appointments WHERE business_id = $1`, [businessId])
    
    if (parseInt(existingAppointments.rows[0].count) === 0) {
      // Create sample appointments for calendar
      const clientsResult = await query(`SELECT id FROM clients WHERE business_id = $1`, [businessId])
      const servicesResult = await query(`SELECT id FROM services WHERE business_id = $1`, [businessId])
      const staffResult = await query(`SELECT id FROM staff WHERE business_id = $1`, [businessId])
      
      if (clientsResult.rows.length > 0 && servicesResult.rows.length > 0 && staffResult.rows.length > 0) {
      const clients = clientsResult.rows
      const services = servicesResult.rows
      const staff = staffResult.rows
      
      // Create appointments for the next 30 days
      const appointments = []
      const today = new Date()
      
      for (let i = 0; i < 30; i++) {
        const appointmentDate = new Date(today)
        appointmentDate.setDate(today.getDate() + i)
        
        // Skip weekends for this example
        if (appointmentDate.getDay() === 0 || appointmentDate.getDay() === 6) continue
        
        // Create 3-8 appointments per day
        const appointmentsPerDay = Math.floor(Math.random() * 6) + 3
        
        for (let j = 0; j < appointmentsPerDay; j++) {
          const hour = Math.floor(Math.random() * 8) + 9 // 9 AM to 5 PM
          const minute = Math.random() < 0.5 ? 0 : 30 // :00 or :30
          
          const startTime = new Date(appointmentDate)
          startTime.setHours(hour, minute, 0, 0)
          
          const service = services[Math.floor(Math.random() * services.length)]
          const client = clients[Math.floor(Math.random() * clients.length)]
          const staffMember = staff[Math.floor(Math.random() * staff.length)]
          
          const endTime = new Date(startTime)
          endTime.setMinutes(startTime.getMinutes() + 60) // Default 60 minutes
          
          const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled']
          const status = i < 0 ? 'completed' : statuses[Math.floor(Math.random() * 2)] // Past appointments are completed, future are scheduled/confirmed
          
          appointments.push([
            businessId,
            client.id,
            staffMember.id,
            service.id,
            startTime.toISOString(),
            endTime.toISOString(),
            status,
            85.00, // Default price
            Math.random() < 0.3 ? 'Client requested specific styling' : null
          ])
        }
      }
      
      // Insert appointments one by one to avoid parameter issues
      for (const appointment of appointments) {
        try {
          await query(`
            INSERT INTO appointments (business_id, client_id, staff_id, service_id, start_time, end_time, status, price, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `, appointment)
        } catch (error) {
          // Skip if appointment already exists or conflicts
          console.log('Skipping appointment due to conflict:', error.message)
        }
      }
    }
    }
    
    res.json({ message: 'Sample data created successfully', userId, businessId })
  } catch (error) {
    console.error('Error creating sample data:', error)
    res.status(500).json({ error: error.message })
  }
})

// Temporary middleware to bypass authentication for testing
const bypassAuth = (req: any, res: any, next: any) => {
  // Set a mock user for testing
  req.user = {
    id: 1,
    email: 'john@example.com',
    businessId: 1
  }
  next()
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/business', bypassAuth, businessRoutes)
app.use('/api/clients', bypassAuth, clientRoutes)
app.use('/api/services', bypassAuth, serviceRoutes)
app.use('/api/staff', bypassAuth, staffRoutes)
app.use('/api/appointments', bypassAuth, appointmentRoutes)

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
