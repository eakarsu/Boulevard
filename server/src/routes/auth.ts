import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'

const router = express.Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // For demo purposes, accept any email/password combination
    // In production, you would verify the password hash
    const userResult = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    )
    
    let user
    if (userResult.rows.length === 0) {
      // Create a demo user if not exists
      const createResult = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, 'Demo', 'User', 'owner')
         RETURNING id, email, first_name, last_name, role`,
        [email, await bcrypt.hash(password, 10)]
      )
      user = createResult.rows[0]
      
      // Create a demo business for the owner
      if (user.role === 'owner') {
        await query(
          `INSERT INTO businesses (name, phone, email, owner_id)
           VALUES ('Demo Salon', '+1 (555) 123-4567', $1, $2)`,
          [email, user.id]
        )
      }
    } else {
      user = userResult.rows[0]
    }
    
    // Generate tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    )
    
    res.json({ token: newToken })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

export default router
