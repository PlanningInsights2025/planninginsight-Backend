import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Missing token' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Admin role required' })
    }
    // Set both for compatibility
    req.adminId = decoded.id || decoded.userId
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id,
      role: decoded.role,
      email: decoded.email
    }
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
