import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const testRoleRequestCreation = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    // Find Manish's user
    const manishUser = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (!manishUser) {
      console.log('❌ Manish user not found!');
      process.exit(1);
    }

    console.log('✅ Found Manish user:');
    console.log(`   ID: ${manishUser._id}`);
    console.log(`   Email: ${manishUser.email}`);
    console.log(`   Name: ${manishUser.profile.firstName} ${manishUser.profile.lastName}`);

    // Generate JWT token for Manish
    const manishToken = jwt.sign(
      { 
        userId: manishUser._id.toString(), 
        email: manishUser.email,
        role: manishUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('\n🔐 Generated JWT token for Manish:');
    console.log(`   ${manishToken.substring(0, 50)}...`);

    // Simulate creating a role request
    console.log('\n📝 Creating test role request...');
    const roleRequest = await RoleRequest.create({
      userId: manishUser._id,
      requestedRole: 'editor',
      reason: 'I would like to become an editor to review and publish articles.'
    });

    console.log('✅ Role request created successfully!');
    console.log(`   Request ID: ${roleRequest._id}`);
    console.log(`   User ID: ${roleRequest.userId}`);
    console.log(`   Requested Role: ${roleRequest.requestedRole}`);
    console.log(`   Reason: ${roleRequest.reason}`);
    console.log(`   Status: ${roleRequest.status}`);

    // Verify it was saved
    const savedRequest = await RoleRequest.findById(roleRequest._id)
      .populate('userId', 'email profile.firstName profile.lastName');
    
    console.log('\n✅ Verified saved request:');
    console.log(`   User Name: ${savedRequest.userId.profile.firstName} ${savedRequest.userId.profile.lastName}`);
    console.log(`   User Email: ${savedRequest.userId.email}`);

    console.log('\n✅ TEST SUCCESSFUL! The role request system is working correctly.');
    console.log('\n🔍 IMPORTANT: Use this token to make requests as Manish:');
    console.log(`\nToken:\n${manishToken}\n`);
    console.log('Copy this token to localStorage as "authToken" in your browser.');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testRoleRequestCreation();
