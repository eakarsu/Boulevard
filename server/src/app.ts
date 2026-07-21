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
import boulevardRoutes from '../boulevard/index.js'
import schedulingRoutes from './routes/scheduling.js'
import paymentsRoutes from './routes/payments.js'
import notificationsRoutes from './routes/notifications.js'
import recurringRoutes from './routes/recurring.js'
import calendarSyncRoutes from './routes/calendar-sync.js'
import analyticsRoutes from './routes/analytics.js'
import serviceCatalogRoutes from './routes/service-catalog.js'
import aiRoutes from './routes/ai.js'
import customFeaturesRoutes from './routes/customFeatures.js'
import { authenticateToken } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const server = createServer(app)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin))
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
})

const PORT = Number.parseInt(process.env.PORT || '8000', 10)

// Middleware
app.use(helmet())
app.use(cors({
  origin: allowedOrigins,
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

const requireDebugRoutes = (req: any, res: any, next: any) => {
  const enabled = process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEBUG_ROUTES === '1'
  if (!enabled) return res.status(404).json({ error: 'Not found' })
  return next()
}

// Add a debug endpoint to check database tables
app.get('/api/debug/tables', requireDebugRoutes, authenticateToken, async (req, res) => {
  try {
    const { query } = await import('./config/database.js')
    
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    const counts: Record<string, number | string> = {}
    for (const table of tables.rows) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table.table_name}`)
        counts[table.table_name] = parseInt(result.rows[0].count)
      } catch (error) {
        counts[table.table_name] = 'Error: ' + (error instanceof Error ? error.message : 'unknown')
      }
    }
    
    res.json({ tables: counts })
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'unknown' })
  }
})

// Add a debug endpoint to create database schema
app.post('/api/debug/create-schema', requireDebugRoutes, authenticateToken, async (req, res) => {
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
app.post('/api/debug/seed', requireDebugRoutes, authenticateToken, async (req, res) => {
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

// Enhanced seed endpoint for feature demos (15+ items per entity)
app.post('/api/debug/seed-features', requireDebugRoutes, authenticateToken, async (req, res) => {
  try {
    const { query } = await import('./config/database.js')

    // Ensure base user and business exist
    let userResult = await query(`SELECT id FROM users WHERE email = 'john@example.com'`)
    let userId: number
    let businessId: number

    if (userResult.rows.length === 0) {
      userResult = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
        VALUES ('john@example.com', '$2b$10$defaulthash', 'John', 'Doe', '+1234567890', 'business_owner')
        RETURNING id
      `)
      userId = userResult.rows[0].id
      const bizResult = await query(`
        INSERT INTO businesses (owner_id, name, description, phone, email)
        VALUES ($1, 'Sample Salon', 'A beautiful salon for feature demos', '+1234567890', 'salon@example.com')
        RETURNING id
      `, [userId])
      businessId = bizResult.rows[0].id
    } else {
      userId = userResult.rows[0].id
      const bizResult = await query(`SELECT id FROM businesses WHERE owner_id = $1`, [userId])
      if (bizResult.rows.length === 0) {
        return res.status(500).json({ error: 'User exists but no business found' })
      }
      businessId = bizResult.rows[0].id
    }

    // --- Seed 18 clients ---
    const clientCount = await query(`SELECT COUNT(*) as count FROM clients WHERE business_id = $1`, [businessId])
    if (parseInt(clientCount.rows[0].count) < 15) {
      const clients = [
        ['Olivia', 'Martin', 'olivia.martin@example.com', '+1201111001', 1520, 10],
        ['Liam', 'Thompson', 'liam.t@example.com', '+1201111002', 980, 6],
        ['Ava', 'White', 'ava.white@example.com', '+1201111003', 2340, 14],
        ['Noah', 'Harris', 'noah.h@example.com', '+1201111004', 450, 3],
        ['Isabella', 'Clark', 'isabella.c@example.com', '+1201111005', 1870, 11],
        ['James', 'Lewis', 'james.l@example.com', '+1201111006', 620, 4],
        ['Mia', 'Robinson', 'mia.r@example.com', '+1201111007', 3100, 18],
        ['Benjamin', 'Walker', 'ben.w@example.com', '+1201111008', 790, 5],
        ['Charlotte', 'Hall', 'charlotte.h@example.com', '+1201111009', 1650, 9],
        ['Elijah', 'Allen', 'elijah.a@example.com', '+1201111010', 1080, 7],
        ['Harper', 'Young', 'harper.y@example.com', '+1201111011', 540, 3],
        ['Lucas', 'King', 'lucas.k@example.com', '+1201111012', 2760, 16],
        ['Amelia', 'Wright', 'amelia.w@example.com', '+1201111013', 1990, 12],
        ['Mason', 'Scott', 'mason.s@example.com', '+1201111014', 330, 2],
        ['Evelyn', 'Green', 'evelyn.g@example.com', '+1201111015', 1440, 8],
        ['Logan', 'Adams', 'logan.a@example.com', '+1201111016', 870, 5],
        ['Abigail', 'Baker', 'abigail.b@example.com', '+1201111017', 2100, 13],
        ['Alexander', 'Nelson', 'alex.n@example.com', '+1201111018', 1250, 7],
      ]
      for (const c of clients) {
        await query(`
          INSERT INTO clients (business_id, first_name, last_name, email, phone, total_spent, appointment_count, last_visit)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - (random() * interval '60 days'))
          ON CONFLICT DO NOTHING
        `, [businessId, ...c])
      }
    }

    // --- Seed 18 services ---
    const serviceCount = await query(`SELECT COUNT(*) as count FROM services WHERE business_id = $1`, [businessId])
    if (parseInt(serviceCount.rows[0].count) < 15) {
      const services = [
        ['Classic Haircut', 'Traditional haircut with wash', 'Hair', 45, 65, '#3B82F6'],
        ['Layered Cut', 'Layered haircut with styling', 'Hair', 60, 85, '#6366F1'],
        ['Balayage', 'Hand-painted highlights', 'Hair', 150, 220, '#8B5CF6'],
        ['Full Color', 'All-over single-process color', 'Hair', 90, 130, '#A855F7'],
        ['Root Touch-Up', 'Regrowth color application', 'Hair', 45, 75, '#D946EF'],
        ['Classic Shave', 'Straight razor shave', 'Grooming', 30, 40, '#10B981'],
        ['Beard Sculpting', 'Precision beard shaping', 'Grooming', 30, 35, '#059669'],
        ['Hot Towel Facial', 'Relaxing hot towel treatment', 'Grooming', 20, 25, '#34D399'],
        ['Gel Manicure', 'Long-lasting gel polish', 'Nails', 45, 55, '#EC4899'],
        ['Spa Pedicure', 'Luxury pedicure treatment', 'Nails', 60, 70, '#F472B6'],
        ['Acrylic Full Set', 'Full set acrylic nails', 'Nails', 75, 80, '#FB7185'],
        ['Deep Tissue Massage', '60-minute deep tissue', 'Spa', 60, 120, '#F59E0B'],
        ['Swedish Massage', 'Relaxation massage', 'Spa', 60, 100, '#FBBF24'],
        ['Facial Treatment', 'Deep cleansing facial', 'Beauty', 45, 90, '#EF4444'],
        ['Eyebrow Threading', 'Precision brow shaping', 'Beauty', 15, 20, '#F87171'],
        ['Lash Extensions', 'Individual lash application', 'Beauty', 90, 150, '#FB923C'],
        ['Keratin Treatment', 'Smoothing hair treatment', 'Hair', 120, 250, '#7C3AED'],
        ['Bridal Package', 'Full bridal hair and makeup', 'Beauty', 180, 350, '#BE185D'],
      ]
      for (const s of services) {
        await query(`
          INSERT INTO services (business_id, name, description, category, duration_minutes, price, color, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT DO NOTHING
        `, [businessId, ...s])
      }
    }

    // --- Seed 16 staff (user + staff pairs) ---
    const staffCount = await query(`SELECT COUNT(*) as count FROM staff WHERE business_id = $1`, [businessId])
    if (parseInt(staffCount.rows[0].count) < 15) {
      const staffMembers = [
        ['emma.stylist@example.com', 'Emma', 'Taylor', 'Lead Stylist', ['Hair Cutting', 'Coloring', 'Styling'], 45, 30],
        ['sophia.color@example.com', 'Sophia', 'Brown', 'Color Specialist', ['Coloring', 'Balayage', 'Highlights'], 40, 28],
        ['olivia.nails@example.com', 'Olivia', 'Jones', 'Nail Technician', ['Manicure', 'Pedicure', 'Nail Art'], 35, 22],
        ['ava.spa@example.com', 'Ava', 'Williams', 'Spa Therapist', ['Massage', 'Facial', 'Body Treatments'], 38, 26],
        ['mia.beauty@example.com', 'Mia', 'Davis', 'Esthetician', ['Facials', 'Waxing', 'Lash Extensions'], 35, 24],
        ['luna.hair@example.com', 'Luna', 'Garcia', 'Junior Stylist', ['Hair Cutting', 'Blow Dry'], 25, 18],
        ['chloe.nails@example.com', 'Chloe', 'Miller', 'Senior Nail Artist', ['Gel Nails', 'Acrylic', 'Nail Design'], 40, 25],
        ['ella.barber@example.com', 'Ella', 'Wilson', 'Barber', ['Mens Cuts', 'Shaving', 'Beard Trim'], 35, 22],
        ['grace.makeup@example.com', 'Grace', 'Moore', 'Makeup Artist', ['Bridal', 'Special Events', 'Contouring'], 42, 28],
        ['lily.massage@example.com', 'Lily', 'Anderson', 'Massage Therapist', ['Swedish', 'Deep Tissue', 'Hot Stone'], 38, 26],
        ['zoe.style@example.com', 'Zoe', 'Thomas', 'Style Director', ['Creative Cuts', 'Extensions', 'Updos'], 50, 35],
        ['maya.skin@example.com', 'Maya', 'Jackson', 'Skincare Expert', ['Chemical Peels', 'Microdermabrasion'], 36, 24],
        ['aria.lash@example.com', 'Aria', 'Lee', 'Lash Specialist', ['Lash Extensions', 'Lash Lift', 'Tinting'], 32, 20],
        ['ivy.color@example.com', 'Ivy', 'Harris', 'Colorist', ['Highlights', 'Ombre', 'Vivid Colors'], 42, 27],
        ['ruby.spa@example.com', 'Ruby', 'Clark', 'Spa Manager', ['All Spa Services', 'Training'], 48, 32],
        ['hazel.hair@example.com', 'Hazel', 'Lewis', 'Apprentice Stylist', ['Blow Dry', 'Washing', 'Assisting'], 20, 16],
      ]
      for (const s of staffMembers) {
        const [email, firstName, lastName, title, skills, commission, hourly] = s as [string, string, string, string, string[], number, number]
        const userRes = await query(`
          INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
          VALUES ($1, '$2b$10$defaulthash', $2, $3, '+1300000' || floor(random()*9999)::text, 'staff')
          ON CONFLICT (email) DO UPDATE SET first_name = EXCLUDED.first_name
          RETURNING id
        `, [email, firstName, lastName])
        const staffUserId = userRes.rows[0].id
        await query(`
          INSERT INTO staff (business_id, user_id, title, skills, commission_rate, hourly_rate, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, true)
          ON CONFLICT (business_id, user_id) DO NOTHING
        `, [businessId, staffUserId, title, skills, commission, hourly])
      }
    }

    // --- Seed additional appointments ---
    const apptCount = await query(`SELECT COUNT(*) as count FROM appointments WHERE business_id = $1`, [businessId])
    if (parseInt(apptCount.rows[0].count) < 15) {
      const allClients = await query(`SELECT id FROM clients WHERE business_id = $1`, [businessId])
      const allServices = await query(`SELECT id, price FROM services WHERE business_id = $1`, [businessId])
      const allStaff = await query(`SELECT id FROM staff WHERE business_id = $1`, [businessId])

      if (allClients.rows.length > 0 && allServices.rows.length > 0 && allStaff.rows.length > 0) {
        const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'in_progress']
        const today = new Date()
        for (let day = -7; day <= 14; day++) {
          const date = new Date(today)
          date.setDate(today.getDate() + day)
          if (date.getDay() === 0) continue // skip Sunday
          const count = Math.floor(Math.random() * 4) + 3
          for (let j = 0; j < count; j++) {
            const hour = Math.floor(Math.random() * 8) + 9
            const minute = Math.random() < 0.5 ? 0 : 30
            const startTime = new Date(date)
            startTime.setHours(hour, minute, 0, 0)
            const svc = allServices.rows[Math.floor(Math.random() * allServices.rows.length)]
            const endTime = new Date(startTime)
            endTime.setMinutes(startTime.getMinutes() + 60)
            const status = day < 0 ? (Math.random() < 0.8 ? 'completed' : 'cancelled') : statuses[Math.floor(Math.random() * 3)]
            try {
              await query(`
                INSERT INTO appointments (business_id, client_id, staff_id, service_id, start_time, end_time, status, price, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              `, [
                businessId,
                allClients.rows[Math.floor(Math.random() * allClients.rows.length)].id,
                allStaff.rows[Math.floor(Math.random() * allStaff.rows.length)].id,
                svc.id,
                startTime.toISOString(),
                endTime.toISOString(),
                status,
                svc.price,
                Math.random() < 0.3 ? 'Feature demo appointment' : null,
              ])
            } catch (_e) { /* skip conflicts */ }
          }
        }
      }
    }

    // --- Create payments table + 15 entries ---
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id),
        appointment_id INTEGER REFERENCES appointments(id),
        client_id INTEGER REFERENCES clients(id),
        amount DECIMAL(10,2) NOT NULL,
        tip DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        method VARCHAR(20) DEFAULT 'card',
        status VARCHAR(30) DEFAULT 'completed',
        card_brand VARCHAR(20),
        card_last4 VARCHAR(4),
        stripe_payment_intent_id VARCHAR(255),
        stripe_charge_id VARCHAR(255),
        refund_amount DECIMAL(10,2) DEFAULT 0,
        refund_reason TEXT,
        stripe_refund_id VARCHAR(255),
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const paymentCount = await query(`SELECT COUNT(*) as count FROM payments WHERE business_id = $1`, [businessId])
    if (parseInt(paymentCount.rows[0].count) < 15) {
      const allAppts = await query(`SELECT a.id, a.client_id, a.price, s.name as service_name FROM appointments a LEFT JOIN services s ON a.service_id = s.id WHERE a.business_id = $1 AND a.status = 'completed' LIMIT 20`, [businessId])
      if (allAppts.rows.length > 0) {
        const methods = ['card', 'card', 'card', 'cash', 'card']
        const cardBrands = ['Visa', 'Mastercard', 'Amex', null, 'Visa']
        const cardLast4s = ['4242', '5555', '3782', null, '1234']
        for (let i = 0; i < Math.min(allAppts.rows.length, 18); i++) {
          const appt = allAppts.rows[i]
          const amount = parseFloat(appt.price) || (Math.floor(Math.random() * 200) + 30)
          const tip = Math.random() < 0.7 ? Math.floor(Math.random() * 30) + 5 : 0
          const total = amount + tip
          const method = methods[i % methods.length]
          const brand = method === 'card' ? cardBrands[i % cardBrands.length] : null
          const last4 = method === 'card' ? cardLast4s[i % cardLast4s.length] : null
          const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'refunded']
          const status = statuses[i % statuses.length]
          try {
            await query(`
              INSERT INTO payments (business_id, appointment_id, client_id, amount, tip, total, method, status, card_brand, card_last4, processed_at, created_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - (random() * interval '30 days'), NOW() - (random() * interval '30 days'))
            `, [businessId, appt.id, appt.client_id, amount, tip, total, method, status, brand, last4])
          } catch (_e) { /* skip conflicts */ }
        }
      }
    }

    // --- Create notification_log table + 15 entries ---
    await query(`
      CREATE TABLE IF NOT EXISTS notification_log (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id),
        client_id INTEGER REFERENCES clients(id),
        appointment_id INTEGER REFERENCES appointments(id),
        type VARCHAR(50) NOT NULL,
        channel VARCHAR(10) DEFAULT 'email',
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        body TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'sent',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const notifCount = await query(`SELECT COUNT(*) as count FROM notification_log WHERE business_id = $1`, [businessId])
    if (parseInt(notifCount.rows[0].count) < 15) {
      const allClientsForNotif = await query(`SELECT id, first_name, last_name, email, phone FROM clients WHERE business_id = $1 LIMIT 18`, [businessId])
      const notifTypes = [
        { type: 'appointment_confirmation', channel: 'email', subject: 'Appointment Confirmed', body: 'Your appointment has been confirmed for tomorrow.' },
        { type: 'appointment_reminder', channel: 'sms', subject: null, body: 'Reminder: You have an appointment tomorrow at 10:00 AM.' },
        { type: 'appointment_reminder', channel: 'email', subject: 'Appointment Reminder', body: 'This is a friendly reminder about your upcoming appointment.' },
        { type: 'appointment_cancellation', channel: 'email', subject: 'Appointment Cancelled', body: 'Your appointment has been cancelled as requested.' },
        { type: 'appointment_confirmation', channel: 'sms', subject: null, body: 'Confirmed! Your appointment is set for this Friday at 2:00 PM.' },
        { type: 'review_request', channel: 'email', subject: 'How was your visit?', body: 'We hope you enjoyed your visit! Please take a moment to leave a review.' },
        { type: 'appointment_reminder', channel: 'email', subject: 'Upcoming Appointment', body: 'Just a reminder that your appointment is in 2 hours.' },
        { type: 'appointment_confirmation', channel: 'email', subject: 'Booking Confirmed', body: 'Great news! Your booking has been confirmed.' },
        { type: 'appointment_rescheduled', channel: 'sms', subject: null, body: 'Your appointment has been rescheduled to next Monday at 11:00 AM.' },
        { type: 'no_show', channel: 'email', subject: 'Missed Appointment', body: 'We noticed you missed your appointment today. Would you like to reschedule?' },
        { type: 'appointment_reminder', channel: 'sms', subject: null, body: 'Your appointment is tomorrow! See you at 3:30 PM.' },
        { type: 'review_request', channel: 'email', subject: 'Rate your experience', body: 'Thank you for your visit! We would love to hear your feedback.' },
        { type: 'appointment_confirmation', channel: 'email', subject: 'Appointment Booked', body: 'Your appointment with our stylist has been booked successfully.' },
        { type: 'appointment_reminder', channel: 'email', subject: 'See you soon!', body: 'Your appointment is coming up in 24 hours. Please arrive 5 minutes early.' },
        { type: 'custom', channel: 'email', subject: 'Special Offer', body: 'As a valued client, enjoy 20% off your next visit!' },
        { type: 'appointment_cancellation', channel: 'sms', subject: null, body: 'Your appointment for today has been cancelled due to staff unavailability.' },
      ]
      const statuses = ['sent', 'delivered', 'sent', 'delivered', 'failed', 'sent', 'delivered', 'sent']
      for (let i = 0; i < notifTypes.length; i++) {
        const client = allClientsForNotif.rows[i % allClientsForNotif.rows.length]
        if (!client) continue
        const n = notifTypes[i]
        const recipient = n.channel === 'email' ? client.email : client.phone
        const status = statuses[i % statuses.length]
        try {
          await query(`
            INSERT INTO notification_log (business_id, client_id, type, channel, recipient, subject, body, status, first_name, last_name, sent_at, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - (random() * interval '14 days'), NOW() - (random() * interval '14 days'))
          `, [businessId, client.id, n.type, n.channel, recipient, n.subject, n.body, status, client.first_name, client.last_name])
        } catch (_e) { /* skip */ }
      }
    }

    // --- Create audit_logs table + 15 entries ---
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id),
        user_email VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    const auditCount = await query(`SELECT COUNT(*) as count FROM audit_logs WHERE business_id = $1`, [businessId])
    if (parseInt(auditCount.rows[0].count) < 15) {
      const actions = [
        ['LOGIN', 'user', 'User logged in from web'],
        ['CREATE_CLIENT', 'client', 'Created new client record'],
        ['UPDATE_SERVICE', 'service', 'Updated service pricing'],
        ['DELETE_APPOINTMENT', 'appointment', 'Cancelled appointment'],
        ['CREATE_APPOINTMENT', 'appointment', 'Booked new appointment'],
        ['UPDATE_STAFF', 'staff', 'Updated staff schedule'],
        ['PROCESS_PAYMENT', 'payment', 'Processed card payment'],
        ['REFUND_PAYMENT', 'payment', 'Issued partial refund'],
        ['EXPORT_DATA', 'report', 'Exported client list'],
        ['UPDATE_SETTINGS', 'business', 'Updated business hours'],
        ['CREATE_SERVICE', 'service', 'Added new service to catalog'],
        ['SEND_NOTIFICATION', 'notification', 'Sent appointment reminder'],
        ['LOGIN_FAILED', 'user', 'Failed login attempt'],
        ['UPDATE_CLIENT', 'client', 'Updated client preferences'],
        ['CREATE_STAFF', 'staff', 'Added new staff member'],
        ['LOGOUT', 'user', 'User logged out'],
      ]
      for (const [action, entity, details] of actions) {
        await query(`
          INSERT INTO audit_logs (business_id, user_email, action, entity_type, entity_id, details, ip_address)
          VALUES ($1, 'john@example.com', $2, $3, floor(random()*100)::integer, $4, '192.168.1.' || floor(random()*255)::text)
        `, [businessId, action, entity, details])
      }
    }

    // Get final counts
    const finalCounts: Record<string, number> = {}
    for (const table of ['clients', 'services', 'staff', 'appointments', 'payments', 'notification_log', 'audit_logs']) {
      const r = await query(`SELECT COUNT(*) as count FROM ${table} WHERE business_id = $1`, [businessId])
      finalCounts[table] = parseInt(r.rows[0].count)
    }

    res.json({
      message: 'Feature seed data created successfully',
      businessId,
      counts: finalCounts,
    })
  } catch (error: any) {
    console.error('Error seeding feature data:', error)
    res.status(500).json({ error: error.message })
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/business', authenticateToken, businessRoutes)
app.use('/api/clients', authenticateToken, clientRoutes)
app.use('/api/services', authenticateToken, serviceRoutes)
app.use('/api/staff', authenticateToken, staffRoutes)
app.use('/api/appointments', authenticateToken, appointmentRoutes)
app.use('/api', boulevardRoutes)

// New feature routes
app.use('/api/scheduling', authenticateToken, schedulingRoutes)
app.use('/api/payments', authenticateToken, paymentsRoutes)
app.use('/api/notifications', authenticateToken, notificationsRoutes)
app.use('/api/recurring', authenticateToken, recurringRoutes)
app.use('/api/calendar-sync', authenticateToken, calendarSyncRoutes)
app.use('/api/analytics', authenticateToken, analyticsRoutes)
app.use('/api/service-catalog', authenticateToken, serviceCatalogRoutes)
app.use('/api/ai', authenticateToken, aiRoutes)
app.use('/api/custom', authenticateToken, customFeaturesRoutes)
// // === Batch 09 Gaps & Frontend Mounts ===
import batch09GapAiBlvd from './routes/batch09GapAi.js'
import batch09GapNonaiBlvd from './routes/batch09GapNonai.js'
app.use('/api/gap-ai-boulevard', batch09GapAiBlvd)
app.use('/api/gap-nonai-boulevard', batch09GapNonaiBlvd)

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
