import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';

const generateTokenForManish = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    // Find or create Manish user
    let user = await User.findOne({ email: 'manishgavali186@gmail.com' });
    
    if (!user) {
      console.log('Creating new user...');
      user = new User({
        email: 'manishgavali186@gmail.com',
        emailVerified: true,
        authProvider: 'google',
        firebaseUid: 'jo5HPz2CwlQOloWaEk0UdeA2c7Z2',
        role: 'user',
        profile: {
          firstName: 'Manish',
          lastName: 'D Gavali',
          avatar: 'https://lh3.googleusercontent.com/a/ACg8ocII1RKGhyZw8DvpbHFJ0QysOIIKvkCyliP8AcLyHMtJczRUIHOW=s96-c'
        },
        status: 'active',
        lastLogin: new Date()
      });
      await user.save();
    }

    console.log('✅ User found/created:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    // Generate token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('\n✅ JWT TOKEN GENERATED:');
    console.log(token);
    
    console.log('\n📋 COPY AND PASTE THIS IN BROWSER CONSOLE:');
    console.log(`localStorage.setItem('authToken', '${token}'); location.reload();`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

generateTokenForManish();
