import mongoose from 'mongoose'

// Cache connection across Vercel serverless invocations
let cached = global._mongoCache
if (!cached) {
  cached = global._mongoCache = { conn: null, promise: null }
}

export async function connectDB(uri) {
        if (!uri) {
                console.error('❌ Missing MongoDB URI, skipping connection.')
                return
        }

        // Return existing connection if available
        if (cached.conn && mongoose.connection.readyState === 1) {
                return cached.conn
        }

        try {
                // Set up connection options
                const options = {
                        dbName: 'planning_insights',
                        serverSelectionTimeoutMS: 10000,
                        socketTimeoutMS: 30000,
                        maxPoolSize: 10,
                        minPoolSize: 1,
                }

                // Reuse in-flight promise to avoid duplicate connections
                if (!cached.promise) {
                        cached.promise = mongoose.connect(uri, options)
                }

                cached.conn = await cached.promise
		
		// Wait for connection to be fully established
		await mongoose.connection.asPromise()
		
		console.log('✅ MongoDB connected successfully')
		console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'planning_insights'}`)
		console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`)
		
		// Handle connection events
		mongoose.connection.on('error', (err) => {
			console.error('❌ MongoDB connection error:', err.message)
		})
		
		mongoose.connection.on('disconnected', () => {
			console.warn('⚠️  MongoDB disconnected')
		})
		
		mongoose.connection.on('reconnected', () => {
			console.log('🔄 MongoDB reconnected')
		})
		
	} catch (e) {
		console.error('❌ MongoDB connection error:', e.message)
		throw e
	}
}

