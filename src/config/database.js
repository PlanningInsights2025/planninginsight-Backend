import mongoose from 'mongoose'

let isConnected = false // Track connection status

export async function connectDB(uri) {
	if (!uri) {
		console.error('❌ Missing MongoDB URI, skipping connection.')
		return
	}

	// Reuse existing connection in serverless environment
	if (isConnected) {
		console.log('✅ Using existing MongoDB connection')
		return
	}
	
	try {
		// Set up connection options optimized for serverless
		const options = {
			dbName: 'planning_insights',
			serverSelectionTimeoutMS: 10000, // Increased for serverless cold starts
			socketTimeoutMS: 45000,
			maxPoolSize: 10, // Connection pool size
			minPoolSize: 1,
		}
		
		// Connect to MongoDB
		await mongoose.connect(uri, options)
		
		isConnected = true
		console.log('✅ MongoDB connected successfully')
		console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'planning_insights'}`)
		console.log(`🌐 Host: ${mongoose.connection.host}`)
		
		// Handle connection events
		mongoose.connection.on('error', (err) => {
			console.error('❌ MongoDB connection error:', err.message)
			isConnected = false
		})
		
		mongoose.connection.on('disconnected', () => {
			console.warn('⚠️  MongoDB disconnected')
			isConnected = false
		})
		
		mongoose.connection.on('reconnected', () => {
			console.log('🔄 MongoDB reconnected')
			isConnected = true
		})
		
	} catch (e) {
		console.error('❌ MongoDB connection error:', e.message)
		isConnected = false
}

