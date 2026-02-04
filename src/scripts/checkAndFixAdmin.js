import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcrypt';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/planning-insights';

async function checkAndFixAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    let admin = await User.findOne({ email: 'admin@planning-insights.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found. Creating new admin...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      admin = new User({
        email: 'admin@planning-insights.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        profile: {
          firstName: 'Admin',
          lastName: 'User'
        },
        settings: {
          twoFactorAuth: {
            enabled: true,
            method: 'email'
          },
          securityQuestion: {
            question: 'In what city were you born?',
            answer: await bcrypt.hash('pune', 10)
          }
        }
      });
      
      await admin.save();
      console.log('✅ Admin user created successfully');
    } else {
      console.log(`📋 Admin user found:`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.status}`);
      
      // Check if role is not 'admin'
      if (admin.role !== 'admin') {
        console.log(`\n⚠️  Incorrect role detected: ${admin.role}`);
        console.log('🔧 Fixing admin role...');
        
        admin.role = 'admin';
        await admin.save();
        
        console.log('✅ Admin role updated to "admin"');
      } else {
        console.log('✅ Admin role is correct');
      }
      
      // Check password
      const passwordValid = await bcrypt.compare('Admin@123', admin.password);
      if (!passwordValid) {
        console.log('\n⚠️  Password mismatch. Resetting password...');
        admin.password = await bcrypt.hash('Admin@123', 10);
        await admin.save();
        console.log('✅ Password reset to Admin@123');
      } else {
        console.log('✅ Password is correct');
      }
      
      // Ensure status is active
      if (admin.status !== 'active') {
        console.log('\n⚠️  Status is not active. Fixing...');
        admin.status = 'active';
        await admin.save();
        console.log('✅ Status set to active');
      } else {
        console.log('✅ Status is active');
      }
    }

    // Final check
    admin = await User.findOne({ email: 'admin@planning-insights.com' });
    console.log('\n📊 Final Admin User Details:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Password: Admin@123`);
    console.log('\n✅ Admin user is ready for login!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAndFixAdmin();
