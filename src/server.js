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
    // Connect to MongoDB
    await connectDB(process.env.MONGODB_URI)
    
    // Create HTTP server
    const server = createServer(app)
    
    // Initialize Socket.IO
    const io = initializeSocket(server)
    app.set('io', io) // Make io available in routes
    console.log('✅ Socket.IO initialized for real-time updates')
    
    // Start Express server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API server listening on http://localhost:${PORT}`)
      console.log(`✅ Server bound to all network interfaces`)
      console.log(`✅ MongoDB connected to: ${process.env.MONGODB_URI}`)
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
