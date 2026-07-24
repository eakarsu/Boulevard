import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'

const router = express.Router()
const tokenLifetime = (value: string | undefined, fallback: string): jwt.SignOptions['expiresIn'] => {
  const selected = value || fallback
  if (/^\d+$/.test(selected)) return Number(selected) as jwt.SignOptions['expiresIn']
  if (/^\d+(?:ms|s|m|h|d|w|y)$/i.test(selected)) return selected as jwt.SignOptions['expiresIn']
  return fallback as jwt.SignOptions['expiresIn']
}
const accessTokenLifetime = tokenLifetime(process.env.JWT_EXPIRES_IN, '15m')
const refreshTokenLifetime = tokenLifetime(process.env.JWT_REFRESH_EXPIRES_IN, '7d')

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const userResult = await query(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = userResult.rows[0]
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    delete user.password_hash
    
    // Generate tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: accessTokenLifetime }
    )
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: refreshTokenLifetime }
    )
    
    res.json({
      user,
      token,
      refreshToken
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName = 'Runtime', lastName = 'User' } = req.body
    if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'A valid email and password of at least 8 characters are required' })
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' })

    const createResult = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, 'owner')
       RETURNING id, email, first_name, last_name, role`,
      [email, await bcrypt.hash(password, 10), firstName, lastName]
    )
    const user = createResult.rows[0]
    await query(
      `INSERT INTO businesses (name, phone, email, owner_id)
       VALUES ($1, '+1 (555) 123-4567', $2, $3)`,
      [`${firstName}'s Business`, email, user.id]
    )
    return res.status(201).json({ user })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({ error: 'Registration failed' })
  }
})

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Access token required' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const result = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    )
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid token' })
    return res.json({ user: result.rows[0] })
  } catch {
    return res.status(403).json({ error: 'Invalid token' })
  }
})

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any
    
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    )
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }
    
    const user = userResult.rows[0]
    
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: accessTokenLifetime }
    )
    
    res.json({ token: newToken })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

export default router
