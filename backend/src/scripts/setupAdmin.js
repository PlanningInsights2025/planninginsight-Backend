import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

dotenv.config()

// Simple User schema for this script
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  status: String,
  emailVerified: Boolean,
  profile: {
    firstName: String,
    lastName: String
  }
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

async function fixAdmin() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/planning_insights'
    console.log('Connecting to:', MONGODB_URI)
    
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    const adminEmail = 'admin@theplanninginsights.com'
    const adminPassword = 'Admin@123'

    console.log('Looking for admin user:', adminEmail)
    let admin = await User.findOne({ email: adminEmail })

    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    console.log('Password hashed successfully\n')

    if (admin) {
      console.log('Found existing user. Updating...')
      admin.password = hashedPassword
      admin.role = 'admin'
      admin.status = 'active'
      admin.emailVerified = true
      if (!admin.profile) admin.profile = {}
      admin.profile.firstName = 'Admin'
      admin.profile.lastName = 'User'
      await admin.save()
      console.log('✅ Admin user UPDATED successfully!\n')
    } else {
      console.log('Admin not found. Creating new admin...')
      admin = new User({
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
      await admin.save()
      console.log('✅ Admin user CREATED successfully!\n')
    }

    console.log('═══════════════════════════════════════')
    console.log('Admin Login Credentials:')
    console.log('═══════════════════════════════════════')
    console.log('Email:    ', adminEmail)
    console.log('Password: ', adminPassword)
    console.log('═══════════════════════════════════════')
    console.log('\n✨ You can now login with these credentials!\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
    process.exit(1)
  }
}

fixAdmin()
