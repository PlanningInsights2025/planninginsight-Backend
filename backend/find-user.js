import mongoose from 'mongoose';
import User from './src/models/User.js';

const findUser = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    // Search for Manish
    const user = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (user) {
      console.log('✅ Found user:');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Profile:', user.profile);
      console.log('Role:', user.role);
    } else {
      console.log('❌ User with email manishgavali186@gmail.com NOT FOUND in database');
      console.log('\n📋 Let me list all users in database:');
      
      const allUsers = await User.find().select('_id email profile.firstName profile.lastName role');
      console.log(`\nTotal users: ${allUsers.length}\n`);
      
      for (const u of allUsers) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ID:', u._id);
        console.log('Email:', u.email);
        console.log('Name:', u.profile?.firstName, u.profile?.lastName);
        console.log('Role:', u.role);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

findUser();
