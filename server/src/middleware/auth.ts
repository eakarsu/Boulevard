import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { query } from '../config/database.js'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    businessId?: string
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // Get user details from database
    const userResult = await query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const user = userResult.rows[0]
    console.log('Auth middleware - User:', { id: user.id, email: user.email, role: user.role })

    // Get business ID if user is staff/owner
    if (user.role === 'staff' || user.role === 'owner' || user.role === 'manager') {
      const businessResult = await query(
        'SELECT business_id FROM staff WHERE user_id = $1 UNION SELECT id as business_id FROM businesses WHERE owner_id = $1',
        [user.id]
      )
      console.log('Auth middleware - Business lookup result:', businessResult.rows)

      if (businessResult.rows.length > 0) {
        user.businessId = businessResult.rows[0].business_id
      }
    }
    console.log('Auth middleware - Final user:', { id: user.id, businessId: user.businessId })

    req.user = user
    next()
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(403).json({ error: 'Invalid token' })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}
