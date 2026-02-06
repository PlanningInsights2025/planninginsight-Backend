import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/database.js'
import User from '../models/User.js'

dotenv.config()

// Admin credentials (hardcoded - not from .env)
const ADMIN_EMAIL = 'admin@planning-insights.com'
const ADMIN_PASSWORD = 'Admin@123'

async function run() {
  const { MONGODB_URI } = process.env
  
  await connectDB(MONGODB_URI)
  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin'
      // Update password as well
      existing.password = await bcrypt.hash(ADMIN_PASSWORD, 10)
      await existing.save()
      console.log('Updated existing user to admin:', existing.email)
    } else {
      console.log('Admin already exists:', existing.email)
      console.log('Email:', ADMIN_EMAIL)
      console.log('Password:', ADMIN_PASSWORD)
    }
    process.exit(0)
  }
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const adminUser = await User.create({ 
    email: ADMIN_EMAIL.toLowerCase(), 
    password: passwordHash, 
    role: 'admin',
    profile: {
      firstName: 'Planning',
      lastName: 'Admin'
    }
  })
  console.log('✓ Created admin user:', adminUser.email)
  console.log('✓ Email:', ADMIN_EMAIL)
  console.log('✓ Password:', ADMIN_PASSWORD)
  process.exit(0)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
