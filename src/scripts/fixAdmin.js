import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/User.js'

dotenv.config()

async function fixAdmin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/planning-insights'
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    const adminEmail = 'admin@planning-insights.com'
    const adminPassword = 'Admin@123'

    // Find existing admin user
    let admin = await User.findOne({ email: adminEmail })

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    if (admin) {
      // Update existing admin
      admin.password = hashedPassword
      admin.role = 'admin'
      admin.status = 'active'
      admin.emailVerified = true
      admin.profile = admin.profile || {}
      admin.profile.firstName = 'Admin'
      admin.profile.lastName = 'User'
      await admin.save()
      console.log('✅ Admin user updated successfully!')
    } else {
      // Create new admin
      admin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        emailVerified: true,
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        }
      })
      console.log('✅ Admin user created successfully!')
    }

    console.log('Admin credentials:')
    console.log('Email:', adminEmail)
    console.log('Password:', adminPassword)
    console.log('\nYou can now login with these credentials.')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixAdmin()
