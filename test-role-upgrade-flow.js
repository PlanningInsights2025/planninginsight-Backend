import mongoose from 'mongoose';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const testRoleUpgradeFlow = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(70));
    console.log('🧪 TESTING ROLE UPGRADE FLOW');
    console.log('=' .repeat(70));

    // Step 1: Find Manish's user
    const manishUser = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (!manishUser) {
      console.log('❌ Manish user not found!');
      process.exit(1);
    }

    console.log('\n📋 Step 1: Current User State');
    console.log(`   Name: ${manishUser.profile.firstName} ${manishUser.profile.lastName}`);
    console.log(`   Email: ${manishUser.email}`);
    console.log(`   Current Role: ${manishUser.role}`);

    // Step 2: Create a test role request
    console.log('\n📋 Step 2: Creating Role Upgrade Request');
    
    // Delete any existing pending requests first
    await RoleRequest.deleteMany({ 
      userId: manishUser._id, 
      status: 'pending' 
    });

    const roleRequest = await RoleRequest.create({
      userId: manishUser._id,
      requestedRole: 'editor',
      reason: 'I would like to contribute as an editor to review and publish quality content on the platform.'
    });

    console.log(`   ✅ Role request created!`);
    console.log(`   Request ID: ${roleRequest._id}`);
    console.log(`   Requested Role: ${roleRequest.requestedRole}`);
    console.log(`   Status: ${roleRequest.status}`);

    // Step 3: Display next steps
    console.log('\n📋 Step 3: Testing Instructions');
    console.log('\n   🔴 FRONTEND TESTING:');
    console.log('   1. Make sure your frontend is running (npm run dev)');
    console.log('   2. Login as MANISH user account');
    console.log('   3. Go to your profile page');
    console.log('   4. You should see "Professional" badge');
    console.log('\n   🟢 ADMIN APPROVAL:');
    console.log('   5. Open a new browser window/tab (or Incognito mode)');
    console.log('   6. Login to admin panel (/admin/login)');
    console.log('   7. Go to "Role Upgrade Requests"');
    console.log(`   8. You will see request from "${manishUser.profile.firstName} ${manishUser.profile.lastName}"`);
    console.log('   9. Click "Approve"');
    console.log('\n   🎉 REAL-TIME UPDATE:');
    console.log('   10. Go back to Manish\'s profile page');
    console.log('   11. Within 30 seconds, the badge should change to "Editor"');
    console.log('   12. You should see a success notification');
    console.log('   13. If socket connection is active, it updates INSTANTLY!');

    console.log('\n' + '=' .repeat(70));
    console.log('✅ TEST SETUP COMPLETE');
    console.log('=' .repeat(70));

    console.log('\n💡 How the real-time update works:');
    console.log('   • When admin approves → Backend emits Socket.IO event');
    console.log('   • User profile listens for "role:approved" event');
    console.log('   • Profile also polls /api/auth/me every 30 seconds');
    console.log('   • Either way, role badge updates automatically!');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testRoleUpgradeFlow();
