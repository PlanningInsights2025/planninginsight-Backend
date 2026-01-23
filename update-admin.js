import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './src/models/User.js'

dotenv.config()

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const adminEmail = 'admin@planning-insights.com'
    const adminPassword = '$2a$10$PBOhfS0KgZ4aE/PuDwNc4.rCi2wDJraP9Ei8cdYbjKN4JwyUYhVda' // Fresh bcryptjs hash for Admin@123

    // First, let's see if the user exists
    let user = await User.findOne({ email: adminEmail })
    
    if (user) {
      console.log('Found existing user:', {
        email: user.email,
        role: user.role,
        name: user.name || user.displayName || 'N/A'
      })
      
      // Update to admin role and set password
      user.role = 'admin'
      user.password = adminPassword
      user.status = 'active'
      user.emailVerified = true
      if (!user.name && !user.displayName) {
        user.name = 'Admin User'
      }
      await user.save()
      console.log('✓ Updated user to admin role with correct password')
    } else {
      console.log('User not found. Creating new admin user...')
      user = await User.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        name: 'Admin User',
        displayName: 'Admin User',
        status: 'active',
        emailVerified: true
      })
      console.log('✓ Created new admin user')
    }

    console.log('\nAdmin credentials:')
    console.log('Email:', adminEmail)
    console.log('Password: Admin@123')
    console.log('Role:', user.role)
    
    await mongoose.disconnect()
    console.log('\n✓ Done! You can now login with the admin credentials.')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

updateAdmin()
