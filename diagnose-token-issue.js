import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';

const diagnoseTokenIssue = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/planning_insights');
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 TOKEN DIAGNOSTIC\n');
    console.log('=' .repeat(70));

    // Find Manish
    const manishUser = await User.findOne({ email: 'manishgavali186@gmail.com' });
    if (!manishUser) {
      console.log('❌ Manish user not found!');
      process.exit(1);
    }

    console.log('👤 USER INFO:');
    console.log(`   Name: ${manishUser.profile.firstName} ${manishUser.profile.lastName}`);
    console.log(`   Email: ${manishUser.email}`);
    console.log(`   User ID: ${manishUser._id}`);
    console.log(`   Role: ${manishUser.role}`);

    // Generate a fresh token for Manish
    console.log('\n🔐 GENERATING FRESH TOKEN:');
    const freshToken = jwt.sign(
      { 
        userId: manishUser._id.toString(), 
        email: manishUser.email,
        role: manishUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log(`\n✅ Fresh Token Generated:\n${freshToken}\n`);

    console.log('=' .repeat(70));
    console.log('📋 HOW TO FIX:');
    console.log('=' .repeat(70));
    console.log('\n🔧 Option 1: Replace token in browser (Quick Fix)');
    console.log('   1. Open Browser Console (F12)');
    console.log('   2. Paste this command:');
    console.log(`\n   localStorage.setItem('authToken', '${freshToken}');\n   location.reload();\n`);
    console.log('   3. Try submitting the role request again');

    console.log('\n🔧 Option 2: Logout and Login (Proper Way)');
    console.log('   1. Click Logout button');
    console.log('   2. Login with Manish\'s credentials');
    console.log('   3. Submit role request');

    console.log('\n🔧 Option 3: Clear Everything and Start Fresh');
    console.log('   1. Open Browser Console (F12)');
    console.log('   2. Run: localStorage.clear(); location.reload();');
    console.log('   3. Login as Manish');
    console.log('   4. Submit role request');

    console.log('\n⚠️  WHY THIS HAPPENS:');
    console.log('   • You logged in as Admin (adminToken stored)');
    console.log('   • Then went to user dashboard');
    console.log('   • User dashboard tries to use authToken');
    console.log('   • But authToken might have admin token or expired token');
    console.log('   • Solution: Use separate tokens for admin and user');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

diagnoseTokenIssue();
