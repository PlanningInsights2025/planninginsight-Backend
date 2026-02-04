import mongoose from 'mongoose'
import Article from '../models/Article.js'
import dotenv from 'dotenv'

dotenv.config()

const fixApprovedArticles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/planning-insights')
    console.log('✅ Connected to MongoDB')

    // Find all articles with approvalStatus 'approved' but not properly published
    const approvedArticles = await Article.find({
      approvalStatus: 'approved',
      $or: [
        { status: { $ne: 'published' } },
        { isPublished: { $ne: true } }
      ]
    })

    console.log(`\n📊 Found ${approvedArticles.length} approved articles that need fixing`)

    if (approvedArticles.length === 0) {
      console.log('✅ All approved articles are already properly published!')
      process.exit(0)
    }

    // Update each article
    for (const article of approvedArticles) {
      console.log(`\n🔧 Fixing article: ${article.title}`)
      console.log(`   Current status: ${article.status}`)
      console.log(`   Current isPublished: ${article.isPublished}`)
      
      article.status = 'published'
      article.isPublished = true
      if (!article.publishedAt) {
        article.publishedAt = article.updatedAt || new Date()
      }
      
      await article.save()
      
      console.log(`   ✅ Updated to: status='published', isPublished=true`)
    }

    console.log(`\n✅ Successfully fixed ${approvedArticles.length} articles!`)
    console.log('👉 Refresh your newsroom page to see the articles')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error fixing approved articles:', error)
    process.exit(1)
  }
}

fixApprovedArticles()
