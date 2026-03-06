import dotenv from 'dotenv'
import mongoose from 'mongoose'
import readline from 'readline'

dotenv.config()

const OLD_DB = 'planning-insights'

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function deleteOldDatabase() {
  try {
    console.log('🗑️  Database Cleanup Script')
    console.log('═══════════════════════════════════════\n')
    console.log(`This will permanently delete the database: ${OLD_DB}`)
    console.log('⚠️  This action cannot be undone!\n')
    
    const answer = await question('Are you sure you want to delete this database? (yes/no): ')
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Deletion cancelled.')
      rl.close()
      process.exit(0)
    }
    
    console.log('\n🔄 Connecting to database...')
    const connection = await mongoose.createConnection(
      `mongodb://localhost:27017/${OLD_DB}`
    ).asPromise()
    
    console.log(`✅ Connected to: ${OLD_DB}`)
    console.log('🗑️  Dropping database...')
    
    await connection.db.dropDatabase()
    
    console.log('\n═══════════════════════════════════════')
    console.log('✅ Database deleted successfully!')
    console.log('═══════════════════════════════════════')
    console.log(`\n'${OLD_DB}' has been permanently removed.`)
    console.log(`\nYour application now uses: 'planning_insights'`)
    console.log('\n📝 Next steps:')
    console.log('   1. Refresh MongoDB Compass to see the change')
    console.log('   2. Start your backend server: npm run dev')
    console.log('   3. All data is now in planning_insights database\n')
    
    await connection.close()
    rl.close()
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    rl.close()
    process.exit(1)
  }
}

deleteOldDatabase()
