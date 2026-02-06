import app from '../src/app.js'
import { connectDB } from '../src/config/database.js'

let isConnected = false

export default async (req, res) => {
  // Set CORS headers for all requests
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://astounding-arithmetic-ef6af9.netlify.app',
    'https://theplanninginsights.com',
    'https://planninginsights.com'
  ]
  
  const origin = req.headers.origin
  
  // Allow the origin if it's in the list or matches netlify pattern
  if (origin && (allowedOrigins.includes(origin) || origin.includes('netlify.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Connect to database if not already connected
  if (!isConnected) {
    try {
      await connectDB(process.env.MONGODB_URI)
      isConnected = true
    } catch (error) {
      console.error('Database connection error:', error)
      // Continue anyway - some routes don't need DB
    }
  }
  
  return app(req, res)
}
