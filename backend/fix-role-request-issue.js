import mongoose from 'mongoose';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const fixRoleRequestIssue = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find all role requests
    console.log('🔍 Step 1: Finding ALL role requests...');
    const allRequests = await RoleRequest.find({});
    console.log(`Found ${allRequests.length} role requests\n`);

    // Step 2: Display each request with full details
    for (const request of allRequests) {
      console.log('━'.repeat(60));
      console.log(`Request ID: ${request._id}`);
      console.log(`User ID (raw): ${request.userId}`);
      console.log(`Requested Role: ${request.requestedRole}`);
      console.log(`Reason: ${request.reason}`);
      console.log(`Status: ${request.status}`);
      console.log(`Created: ${request.createdAt}`);
      
      // Try to populate the user
      const populatedRequest = await RoleRequest.findById(request._id)
        .populate('userId', 'email profile.firstName profile.lastName');
      
      if (populatedRequest && populatedRequest.userId) {
        console.log(`\n👤 Populated User Info:`);
        console.log(`   Name: ${populatedRequest.userId.profile?.firstName || 'N/A'} ${populatedRequest.userId.profile?.lastName || ''}`);
        console.log(`   Email: ${populatedRequest.userId.email || 'N/A'}`);
      } else {
        console.log(`\n⚠️  Could not populate user - user might be deleted or userId is invalid`);
        
        // Check if this userId exists in User collection
        const userExists = await User.findById(request.userId);
        if (!userExists) {
          console.log(`   ❌ User with ID ${request.userId} does NOT exist in database!`);
          console.log(`   This is an ORPHANED request and should be deleted.`);
        }
      }
      console.log('━'.repeat(60));
      console.log('');
    }

    // Step 3: Delete all orphaned or admin role requests
    console.log('\n🧹 Step 3: Cleaning up role requests...');
    
    const adminUser = await User.findOne({ email: 'admin@planning-insights.com' });
    const manishUser = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (adminUser) {
      const adminRequests = await RoleRequest.deleteMany({ userId: adminUser._id });
      console.log(`   ✓ Deleted ${adminRequests.deletedCount} requests from admin account`);
    }

    // Delete orphaned requests (where user doesn't exist)
    const allRequestIds = await RoleRequest.find({}).select('_id userId');
    let orphanedCount = 0;
    for (const req of allRequestIds) {
      const userExists = await User.findById(req.userId);
      if (!userExists) {
        await RoleRequest.deleteOne({ _id: req._id });
        orphanedCount++;
      }
    }
    console.log(`   ✓ Deleted ${orphanedCount} orphaned requests`);

    // Step 4: Count remaining requests
    const remainingRequests = await RoleRequest.find({})
      .populate('userId', 'email profile.firstName profile.lastName');
    
    console.log(`\n✅ Step 4: Final status - ${remainingRequests.length} valid request(s) remaining:`);
    for (const req of remainingRequests) {
      console.log(`   - ${req.userId?.profile?.firstName} ${req.userId?.profile?.lastName} (${req.userId?.email})`);
      console.log(`     Role: ${req.requestedRole}, Status: ${req.status}`);
    }

    console.log('\n🎉 Cleanup complete! Refresh your admin panel to see the updated list.');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixRoleRequestIssue();
