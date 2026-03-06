import mongoose from 'mongoose';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const resetManishRole = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    const email = 'manishgavali186@gmail.com';

    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('📋 Current Status:');
    console.log(`   User: ${user.profile.firstName} ${user.profile.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Current Role: ${user.role}`);

    // Delete all role requests for this user
    const deletedRequests = await RoleRequest.deleteMany({ userId: user._id });
    console.log(`\n🗑️  Deleted ${deletedRequests.deletedCount} role request(s)`);

    // Reset role to "user"
    user.role = 'user';
    await user.save();
    console.log(`\n✅ Role reset to: ${user.role}`);

    console.log('\n✨ Done! You can now submit a new role request.');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetManishRole();
