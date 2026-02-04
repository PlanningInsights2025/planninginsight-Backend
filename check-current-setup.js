import mongoose from 'mongoose';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const checkAndSetup = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    // Find Manish's user
    const manishUser = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (!manishUser) {
      console.log('❌ Manish user not found!');
      process.exit(1);
    }

    console.log('👤 CURRENT USER STATUS:');
    console.log(`   Name: ${manishUser.profile.firstName} ${manishUser.profile.lastName}`);
    console.log(`   Email: ${manishUser.email}`);
    console.log(`   Current Role: ${manishUser.role}`);
    console.log(`   User ID: ${manishUser._id}`);

    // Check if there are any role requests
    const existingRequests = await RoleRequest.find({ userId: manishUser._id });
    console.log(`\n📋 EXISTING ROLE REQUESTS: ${existingRequests.length}`);
    existingRequests.forEach((req, i) => {
      console.log(`   ${i + 1}. ${req.requestedRole} - ${req.status} (Created: ${req.createdAt})`);
    });

    // Ask what to do
    console.log('\n🔧 SETUP OPTIONS:');
    console.log('   1. If Manish is "editor" and you want to test the update:');
    console.log('      • First change his role back to "user"');
    console.log('      • Then create a new role request');
    console.log('      • Then approve it from admin panel');
    console.log('\n   2. Current setup is:');
    if (manishUser.role === 'editor') {
      console.log('      ✅ Manish is already an EDITOR');
      console.log('      💡 To test: Change role to "user" first, then test approval');
    } else if (manishUser.role === 'user') {
      console.log('      ✅ Manish is a USER (ready to test)');
      console.log('      💡 Now: Login as Manish, check profile shows "Professional"');
      console.log('      💡 Then: Admin approves request, profile updates to "Editor"');
    }

    console.log('\n🎯 TO CHANGE ROLE TO USER (for testing):');
    console.log('   Run this command:');
    console.log('   node -e "require(\'./src/models/User.js\'); const mongoose = require(\'mongoose\'); mongoose.connect(\'mongodb://localhost:27017/planning_insights\').then(async () => { const User = require(\'./src/models/User.js\').default; await User.findOneAndUpdate({ email: \'manishgavali186@gmail.com\' }, { role: \'user\' }); console.log(\'✅ Role changed to user\'); process.exit(); });"');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAndSetup();
