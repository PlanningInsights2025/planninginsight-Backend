import mongoose from 'mongoose';
import RoleRequest from './src/models/RoleRequest.js';
import User from './src/models/User.js';

const checkRoleRequests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    // Get all role requests
    const requests = await RoleRequest.find()
      .populate('userId')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`📋 Found ${requests.length} role requests:\n`);

    for (const request of requests) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Request ID:', request._id);
      console.log('User ID (raw):', request.userId?._id || 'NOT POPULATED');
      console.log('User Email:', request.userId?.email || 'NO EMAIL');
      console.log('User Profile:', {
        firstName: request.userId?.profile?.firstName,
        lastName: request.userId?.profile?.lastName
      });
      console.log('Requested Role:', request.requestedRole);
      console.log('Reason:', request.reason);
      console.log('Status:', request.status);
      console.log('Created:', request.createdAt);
      console.log('');
    }

    // Also check users with email containing "manish" or "admin"
    console.log('\n📧 Checking users:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const users = await User.find({
      $or: [
        { email: /manish/i },
        { email: /admin/i }
      ]
    }).select('_id email profile.firstName profile.lastName role');

    for (const user of users) {
      console.log('\nUser ID:', user._id);
      console.log('Email:', user.email);
      console.log('Name:', user.profile?.firstName, user.profile?.lastName);
      console.log('Role:', user.role);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkRoleRequests();
