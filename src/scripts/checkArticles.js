import dotenv from 'dotenv'
import { connectDB } from '../config/database.js'
import Article from '../models/Article.js'

dotenv.config()

async function checkArticles() {
  try {
    await connectDB(process.env.MONGODB_URI)
    
    const allArticles = await Article.find({})
    console.log('\n=== ALL ARTICLES IN DATABASE ===')
    console.log('Total articles:', allArticles.length)
    
    if (allArticles.length > 0) {
      allArticles.forEach((article, index) => {
        console.log(`\nArticle ${index + 1}:`)
        console.log('  ID:', article._id)
        console.log('  Title:', article.title)
        console.log('  Status:', article.status)
        console.log('  ApprovalStatus:', article.approvalStatus)
        console.log('  Author:', article.author)
        console.log('  Created:', article.createdAt)
      })
    } else {
      console.log('No articles found in database')
    }
    
    // Check by approval status
    const pendingArticles = await Article.find({ approvalStatus: 'pending' })
    console.log('\n=== PENDING ARTICLES ===')
    console.log('Count:', pendingArticles.length)
    
    const approvedArticles = await Article.find({ approvalStatus: 'approved' })
    console.log('\n=== APPROVED ARTICLES ===')
    console.log('Count:', approvedArticles.length)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkArticles()
