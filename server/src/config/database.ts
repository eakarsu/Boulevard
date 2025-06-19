import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Default database configuration
const defaultConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'boulevard_dev',
  user: process.env.DB_USER || process.env.USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
}

console.log('Database config:', {
  ...defaultConfig,
  password: defaultConfig.password ? '[HIDDEN]' : '[EMPTY]'
})

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(!process.env.DATABASE_URL && defaultConfig),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export const connectDatabase = async () => {
  try {
    const client = await pool.connect()
    console.log('Connected to PostgreSQL database')
    client.release()
  } catch (error) {
    console.error('Database connection error:', error)
    throw error
  }
}

export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

export default pool
