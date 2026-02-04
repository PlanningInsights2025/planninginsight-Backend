import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './src/models/User.js';
import RoleRequest from './src/models/RoleRequest.js';

const fixUserAndRequests = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    // Check if Manish already exists
    let manishUser = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (!manishUser) {
      console.log('📝 Creating new user for Manish D Gavali...');
      
      // Create the user
      const hashedPassword = await bcrypt.hash('TempPassword123!', 10);
      
      manishUser = new User({
        email: 'manishgavali186@gmail.com',
        password: hashedPassword,
        emailVerified: true,
        authProvider: 'google',
        role: 'user',
        profile: {
          firstName: 'Manish',
          lastName: 'D Gavali',
          avatar: '',
          bio: '',
          phone: '',
          location: 'Country',
          organization: '',
          position: ''
        },
        status: 'active',
        lastLogin: new Date()
      });
      
      await manishUser.save();
      console.log('✅ User created successfully!');
      console.log('   User ID:', manishUser._id);
      console.log('   Email:', manishUser.email);
      console.log('   Name:', manishUser.profile.firstName, manishUser.profile.lastName);
    } else {
      console.log('✅ User already exists!');
      console.log('   User ID:', manishUser._id);
      console.log('   Email:', manishUser.email);
    }

    // Now fix the role requests - find requests that belong to admin but should belong to Manish
    console.log('\n📋 Checking role requests...');
    
    const adminUser = await User.findOne({ email: 'admin@planning-insights.com' });
    if (adminUser) {
      // Find pending requests from admin
      const incorrectRequests = await RoleRequest.find({
        userId: adminUser._id,
        status: 'pending'
      });

      console.log(`   Found ${incorrectRequests.length} pending requests from admin account`);

      if (incorrectRequests.length > 0) {
        console.log('   Fixing these requests to point to Manish...');
        
        for (const request of incorrectRequests) {
          request.userId = manishUser._id;
          await request.save();
          console.log(`   ✓ Fixed request ${request._id} - Role: ${request.requestedRole}`);
        }
      }
    }

    // Show final status
    console.log('\n✅ FINAL STATUS:');
    const manishRequests = await RoleRequest.find({ userId: manishUser._id })
      .sort({ createdAt: -1 });
    
    console.log(`   Manish has ${manishRequests.length} role request(s):`);
    for (const req of manishRequests) {
      console.log(`   - ${req.requestedRole} (${req.status}) - Reason: ${req.reason}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    console.log('🎉 All fixed! Refresh the admin panel to see the correct user details.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixUserAndRequests();
