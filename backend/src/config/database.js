import mongoose from 'mongoose'

export async function connectDB(uri) {
	if (!uri) {
		console.error('❌ Missing MongoDB URI, skipping connection.')
		return
	}
	
	try {
		// Set up connection options
		const options = {
			dbName: 'planning_insights',
			serverSelectionTimeoutMS: 15000, // 15 seconds
			socketTimeoutMS: 45000,
		}
		
		// Connect to MongoDB
		await mongoose.connect(uri, options)
		
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

