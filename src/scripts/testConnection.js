import dotenv from 'dotenv'
import { connectDB } from '../config/database.js'
import mongoose from 'mongoose'

dotenv.config()

console.log('🔍 Testing MongoDB Connection...')
console.log('📍 MongoDB URI:', process.env.MONGODB_URI)
console.log('')

connectDB(process.env.MONGODB_URI)
  .then(() => {
    console.log('')
    console.log('✅ Connection test successful!')
    console.log('🎉 You can now start your backend server')
    process.exit(0)
  })
  .catch((error) => {
    console.log('')
    console.log('❌ Connection test failed!')
    console.log('💡 Make sure MongoDB is running on your system')
    console.log('')
    console.log('To start MongoDB:')
    console.log('  1. Open MongoDB Compass')
    console.log('  2. Or run: mongod')
    console.log('')
    process.exit(1)
  })
