import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const OLD_DB = 'planning-insights'
const NEW_DB = 'planning_insights'

async function mergeDatabases() {
  try {
    console.log('🔄 Starting database merge process...\n')
    
    // Connect to the old database (with hyphen)
    const oldConnection = await mongoose.createConnection(
      `mongodb://localhost:27017/${OLD_DB}`
    ).asPromise()
    console.log(`✅ Connected to OLD database: ${OLD_DB}`)
    
    // Connect to the new database (with underscore)
    const newConnection = await mongoose.createConnection(
      `mongodb://localhost:27017/${NEW_DB}`
    ).asPromise()
    console.log(`✅ Connected to NEW database: ${NEW_DB}\n`)
    
    // Get all collections from old database
    const collections = await oldConnection.db.listCollections().toArray()
    console.log(`📊 Found ${collections.length} collections in ${OLD_DB}:`)
    collections.forEach(col => console.log(`   - ${col.name}`))
    console.log('')
    
    // Migrate each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name
      
      if (collectionName === 'system.indexes') continue // Skip system collections
      
      console.log(`\n📦 Migrating collection: ${collectionName}`)
      
      const oldCollection = oldConnection.db.collection(collectionName)
      const newCollection = newConnection.db.collection(collectionName)
      
      // Get all documents from old collection
      const documents = await oldCollection.find({}).toArray()
      console.log(`   Found ${documents.length} documents`)
      
      if (documents.length > 0) {
        // Check if collection already exists in new database
        const existingDocs = await newCollection.find({}).toArray()
        
        if (existingDocs.length > 0) {
          console.log(`   ⚠️  Collection already has ${existingDocs.length} documents in ${NEW_DB}`)
          console.log(`   Merging documents (avoiding duplicates)...`)
          
          // Get existing IDs and emails to avoid duplicates
          const existingIds = new Set(existingDocs.map(doc => doc._id.toString()))
          const existingEmails = new Set(
            existingDocs
              .filter(doc => doc.email)
              .map(doc => doc.email.toLowerCase())
          )
          
          // Filter out documents that already exist by ID or email
          const newDocs = documents.filter(doc => {
            const idExists = existingIds.has(doc._id.toString())
            const emailExists = doc.email && existingEmails.has(doc.email.toLowerCase())
            return !idExists && !emailExists
          })
          
          if (newDocs.length > 0) {
            await newCollection.insertMany(newDocs)
            console.log(`   ✅ Inserted ${newDocs.length} new documents`)
          } else {
            console.log(`   ℹ️  No new documents to insert (all already exist)`)
          }
          
          // Report skipped duplicates
          const skipped = documents.length - newDocs.length
          if (skipped > 0) {
            console.log(`   ⏭️  Skipped ${skipped} duplicate document(s)`)
          }
        } else {
          // Collection doesn't exist in new database, insert all
          await newCollection.insertMany(documents)
          console.log(`   ✅ Inserted ${documents.length} documents`)
        }
      }
    }
    
    console.log('\n\n═══════════════════════════════════════')
    console.log('✅ Database merge completed!')
    console.log('═══════════════════════════════════════')
    console.log(`\nAll data from '${OLD_DB}' has been merged into '${NEW_DB}'`)
    console.log(`\nYou can now safely delete the '${OLD_DB}' database.`)
    console.log('\n📝 To delete the old database in MongoDB Compass:')
    console.log(`   1. Right-click on '${OLD_DB}' database`)
    console.log('   2. Select "Drop Database"')
    console.log('   3. Confirm deletion')
    
    await oldConnection.close()
    await newConnection.close()
    
  } catch (error) {
    console.error('❌ Error during merge:', error.message)
    process.exit(1)
  }
}

mergeDatabases()
