/**
 * Quick script to update a specific submission's type to 'research-paper'
 * Usage: node updateSpecificSubmission.js <manuscript-title-or-id>
 */

const mongoose = require('mongoose');
const Manuscript = require('../models/Manuscript');
require('dotenv').config();

const updateSpecificSubmission = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/planning-insights');
    console.log('✅ Connected to MongoDB');

    // Get the search term from command line arguments
    const searchTerm = process.argv[2];
    
    if (!searchTerm) {
      console.log('\n❌ Please provide a manuscript title or ID');
      console.log('Usage: node updateSpecificSubmission.js "prabhassss"');
      console.log('   or: node updateSpecificSubmission.js <manuscript-id>');
      process.exit(1);
    }

    // Try to find by title first (case-insensitive search)
    let manuscript = await Manuscript.findOne({ 
      title: { $regex: searchTerm, $options: 'i' }
    }).populate('requirementId');

    // If not found by title, try by ID
    if (!manuscript && mongoose.Types.ObjectId.isValid(searchTerm)) {
      manuscript = await Manuscript.findById(searchTerm).populate('requirementId');
    }

    if (!manuscript) {
      console.log(`\n❌ No manuscript found matching: "${searchTerm}"`);
      
      // Show all available manuscripts
      const allManuscripts = await Manuscript.find().limit(10).populate('requirementId');
      console.log('\n📝 Recent submissions:');
      allManuscripts.forEach((ms, index) => {
        console.log(`${index + 1}. "${ms.title}" (ID: ${ms._id}) - Type: ${ms.type || 'not set'}`);
      });
      
      process.exit(1);
    }

    console.log('\n📄 Found submission:');
    console.log(`   Title: ${manuscript.title}`);
    console.log(`   ID: ${manuscript._id}`);
    console.log(`   Author: ${manuscript.author?.name || 'N/A'}`);
    console.log(`   Current Type: ${manuscript.type || 'not set'}`);
    console.log(`   Status: ${manuscript.status}`);
    console.log(`   Requirement: ${manuscript.requirementId?.title || 'N/A'}`);

    // Update to research-paper
    manuscript.type = 'research-paper';
    await manuscript.save();

    console.log('\n✅ Successfully updated to type: research-paper');
    console.log('🎉 This submission will now appear in "My Research Paper Submissions"!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

updateSpecificSubmission();
