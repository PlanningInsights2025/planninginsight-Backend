import app from '../src/app.js'
import { connectDB } from '../src/config/database.js'

let isConnected = false

export default async (req, res) => {
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
