import mongoose from 'mongoose';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const debugRoleRequests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(60));
    console.log('🔍 DEBUGGING ROLE REQUESTS');
    console.log('=' .repeat(60));

    // Find all users
    console.log('\n📋 ALL USERS IN DATABASE:');
    const allUsers = await User.find({}).select('email profile.firstName profile.lastName role');
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.profile.firstName} ${user.profile.lastName}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    });

    // Find all role requests
    console.log('\n\n📋 ALL ROLE REQUESTS IN DATABASE:');
    const allRequests = await RoleRequest.find({})
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 });
    
    if (allRequests.length === 0) {
      console.log('   No role requests found!');
    } else {
      allRequests.forEach((request, index) => {
        console.log(`\n${index + 1}. Request ID: ${request._id}`);
        console.log(`   User ID in DB: ${request.userId?._id || 'NULL'}`);
        console.log(`   User Name: ${request.userId?.profile?.firstName || 'N/A'} ${request.userId?.profile?.lastName || ''}`);
        console.log(`   User Email: ${request.userId?.email || 'N/A'}`);
        console.log(`   Requested Role: ${request.requestedRole}`);
        console.log(`   Reason: ${request.reason || 'No reason'}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Created: ${request.createdAt}`);
      });
    }

    // Find Manish's user
    console.log('\n\n🔍 SEARCHING FOR MANISH D GAVALI:');
    const manishUser = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (manishUser) {
      console.log('✅ Found Manish!');
      console.log(`   ID: ${manishUser._id}`);
      console.log(`   Email: ${manishUser.email}`);
      console.log(`   Name: ${manishUser.profile.firstName} ${manishUser.profile.lastName}`);
      console.log(`   Role: ${manishUser.role}`);

      // Find Manish's role requests
      const manishRequests = await RoleRequest.find({ userId: manishUser._id });
      console.log(`\n   Manish has ${manishRequests.length} role request(s):`);
      manishRequests.forEach((req) => {
        console.log(`   - ${req.requestedRole} (${req.status}) - Created: ${req.createdAt}`);
      });
    } else {
      console.log('❌ Manish user not found in database!');
    }

    // Find admin user
    console.log('\n\n🔍 SEARCHING FOR ADMIN USER:');
    const adminUser = await User.findOne({ email: 'admin@planning-insights.com' });
    
    if (adminUser) {
      console.log('✅ Found Admin!');
      console.log(`   ID: ${adminUser._id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.profile.firstName} ${adminUser.profile.lastName}`);
      console.log(`   Role: ${adminUser.role}`);

      // Find admin's role requests (shouldn't have any!)
      const adminRequests = await RoleRequest.find({ userId: adminUser._id });
      console.log(`\n   Admin has ${adminRequests.length} role request(s):`);
      if (adminRequests.length > 0) {
        console.log('   ⚠️  WARNING: Admin should NOT have role requests!');
        adminRequests.forEach((req) => {
          console.log(`   - ${req.requestedRole} (${req.status}) - Created: ${req.createdAt}`);
        });
      }
    } else {
      console.log('❌ Admin user not found in database!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ DEBUG COMPLETE');
    console.log('='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugRoleRequests();
