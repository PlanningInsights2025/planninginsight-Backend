import jwt from 'jsonwebtoken'

// Verify JWT token and attach user to request
export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    console.log('🔐 JWT Token Decoded:', JSON.stringify(decoded, null, 2))
    console.log('🔐 Available user ID fields:', {
      userId: decoded.userId,
      id: decoded.id,
      _id: decoded._id
    })
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Optional authentication - doesn't fail if no token provided
export const authenticateOptional = (req, res, next) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      // No token provided, continue without authentication
      req.user = null
      return next()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    req.user = decoded
    next()
  } catch (err) {
    // Invalid token, continue without authentication
    req.user = null
    next()
  }
}

// Require admin role
export const requireAdmin = (req, res, next) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' })
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

// Require user role
export const requireUser = (req, res, next) => {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    
    if (decoded.role !== 'user') {
      return res.status(403).json({ message: 'User access required' })
    }

    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
