import dotenv from 'dotenv'
import { createServer } from 'http'
import app from './app.js'
import { connectDB } from './config/database.js'
import { initializeSocket } from './config/socket.js'

dotenv.config()

const PORT = process.env.PORT || 3000

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    // Create HTTP server and start listening immediately
    const server = createServer(app)
    const io = initializeSocket(server)
    app.set('io', io)
    console.log('✅ Socket.IO initialized for real-time updates')

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API server listening on http://localhost:${PORT}`)
      console.log(`✅ Server bound to all network interfaces`)
      console.log(`✅ Socket.IO ready for real-time connections`)
    })

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error.message);
        process.exit(1);
      }
    });

    // Connect to MongoDB with retry (non-blocking)
    const connectWithRetry = async (attempt = 1, maxAttempts = 5) => {
      try {
        await connectDB(process.env.MONGODB_URI)
        console.log('✅ MongoDB connected successfully')
      } catch (error) {
        console.error(`❌ MongoDB connection error (attempt ${attempt}/${maxAttempts}):`, error.message)
        if (attempt < maxAttempts) {
          const delay = Math.min(5000 * attempt, 30000)
          console.log(`🔄 Retrying in ${delay / 1000}s...`)
          setTimeout(() => connectWithRetry(attempt + 1, maxAttempts), delay)
        } else {
          console.error('❌ MongoDB connection failed after all retries.')
          console.error('   ⚠ Please whitelist your IP in MongoDB Atlas Network Access.')
          console.error(`   ⚠ Current server IP may need to be added to Atlas allowlist.`)
        }
      }
    }
    connectWithRetry()

  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

// Export app for Vercel serverless
export default app

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})
