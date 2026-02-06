import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/database.js'
import User from '../models/User.js'

dotenv.config()

async function checkAdmin() {
  try {
    await connectDB(process.env.MONGODB_URI)
    
    const user = await User.findOne({ email: 'admin@planning-insights.com' })
    
    if (!user) {
      console.log('❌ Admin user NOT found in database')
      process.exit(1)
    }
    
    console.log('✓ Admin user found')
    console.log('Email:', user.email)
    console.log('Role:', user.role)
    console.log('Status:', user.status)
    console.log('Profile:', user.profile)
    
    // Test password
    const testPassword = 'Admin@123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    
    console.log('\nPassword test:')
    console.log('Testing password:', testPassword)
    console.log('Result:', isValid ? '✓ VALID' : '❌ INVALID')
    
    if (!isValid) {
      console.log('\n⚠️  Password mismatch! Updating password...')
      user.password = await bcrypt.hash(testPassword, 10)
      await user.save()
      console.log('✓ Password updated successfully')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkAdmin()
