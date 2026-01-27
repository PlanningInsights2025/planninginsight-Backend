import { connectDB } from '../config/database.js'

/**
 * Middleware to ensure database is connected before processing requests
 * Essential for serverless environments where each invocation may need a new connection
 */
export const ensureDBConnection = async (req, res, next) => {
  try {
    // This will reuse existing connection if already connected
    await connectDB(process.env.MONGODB_URI)
    next()
  } catch (error) {
    console.error('❌ Database connection failed in middleware:', error.message)
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    })
  }
}
