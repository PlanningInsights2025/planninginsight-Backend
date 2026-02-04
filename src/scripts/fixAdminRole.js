import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/planning_insights';

async function fixAdminRole() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'planning_insights'
    });
    console.log('✅ Connected to MongoDB');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);

    // Find the admin user
    const admin = await User.findOne({ email: 'admin@planning-insights.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`📋 Current admin details:`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   ID: ${admin._id}`);

    // Update role to admin
    if (admin.role !== 'admin') {
      console.log('\n🔧 Updating role from "' + admin.role + '" to "admin"...');
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Admin role updated successfully!');
    } else {
      console.log('✅ Role is already "admin"');
    }

    // Verify the update
    const verifyAdmin = await User.findOne({ email: 'admin@planning-insights.com' });
    console.log('\n📊 Final admin details:');
    console.log(`   Email: ${verifyAdmin.email}`);
    console.log(`   Role: ${verifyAdmin.role}`);
    console.log(`   Status: ${verifyAdmin.status}`);
    console.log('\n✅ Admin user is ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAdminRole();
