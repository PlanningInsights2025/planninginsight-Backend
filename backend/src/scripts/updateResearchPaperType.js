/**
 * Script to update existing research paper submissions with type field
 * Run this once to fix submissions created before type field was added
 */

const mongoose = require('mongoose');
const Manuscript = require('../models/Manuscript');
require('dotenv').config();

const updateResearchPaperTypes = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/planning-insights');
    console.log('✅ Connected to MongoDB');

    // Find all manuscripts without a type field
    const manuscriptsWithoutType = await Manuscript.find({ type: { $exists: false } });
    console.log(`\n📊 Found ${manuscriptsWithoutType.length} submissions without type field`);

    if (manuscriptsWithoutType.length === 0) {
      console.log('✅ All submissions already have type field!');
      process.exit(0);
    }

    // Display all submissions for manual selection
    console.log('\n📝 Submissions without type:');
    manuscriptsWithoutType.forEach((ms, index) => {
      console.log(`\n${index + 1}. ${ms.title}`);
      console.log(`   ID: ${ms._id}`);
      console.log(`   Author: ${ms.author?.name || 'N/A'}`);
      console.log(`   Submitted: ${ms.submittedAt?.toDateString() || 'N/A'}`);
    });

    // For now, let's set all submissions without type to 'manuscript' as default
    // You can manually update specific ones to 'research-paper' later
    const result = await Manuscript.updateMany(
      { type: { $exists: false } },
      { $set: { type: 'manuscript' } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} submissions with type: 'manuscript'`);
    console.log('\n💡 To change specific submissions to research-paper, you can:');
    console.log('   1. Note the ID of the submission from the list above');
    console.log('   2. Use MongoDB Compass or the admin panel to update it');
    console.log('   3. Or run: db.manuscripts.updateOne({_id: ObjectId("YOUR_ID")}, {$set: {type: "research-paper"}})');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating manuscripts:', error);
    process.exit(1);
  }
};

// If running directly
if (require.main === module) {
  updateResearchPaperTypes();
}

module.exports = updateResearchPaperTypes;
