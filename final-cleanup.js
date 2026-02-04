import mongoose from 'mongoose';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const cleanupAndPrepare = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(70));
    console.log('🧹 CLEANING UP INCORRECT ROLE REQUESTS');
    console.log('=' .repeat(70));

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@planning-insights.com' });
    
    if (adminUser) {
      // Delete ALL role requests from admin account
      const result = await RoleRequest.deleteMany({ userId: adminUser._id });
      console.log(`\n✅ Deleted ${result.deletedCount} role request(s) from admin account`);
      console.log('   (Admins should not have role requests)');
    }

    // Show remaining requests
    const remainingRequests = await RoleRequest.find({})
      .populate('userId', 'email profile.firstName profile.lastName');
    
    console.log(`\n📋 Remaining role requests: ${remainingRequests.length}`);
    if (remainingRequests.length > 0) {
      remainingRequests.forEach((req, i) => {
        console.log(`\n${i + 1}. ${req.userId?.profile?.firstName} ${req.userId?.profile?.lastName}`);
        console.log(`   Email: ${req.userId?.email}`);
        console.log(`   Role: ${req.requestedRole} (${req.status})`);
      });
    }

    console.log('\n' + '=' .repeat(70));
    console.log('✅ DATABASE CLEANUP COMPLETE');
    console.log('=' .repeat(70));

    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Stop your frontend development server (Ctrl+C)');
    console.log('   2. Clear your browser cache or use Incognito mode');
    console.log('   3. Start frontend again: npm run dev');
    console.log('   4. Login as MANISH (user account)');
    console.log('   5. Submit a role upgrade request');
    console.log('   6. Logout');
    console.log('   7. Login as ADMIN (admin account)');
    console.log('   8. Check the role requests - should show Manish\'s details!');

    console.log('\n⚠️  IMPORTANT:');
    console.log('   - User login and Admin login now use SEPARATE tokens');
    console.log('   - User token: stored as "authToken"');
    console.log('   - Admin token: stored as "adminToken"');
    console.log('   - They will NOT overwrite each other anymore!');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

cleanupAndPrepare();
