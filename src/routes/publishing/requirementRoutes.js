import { Router } from 'express'
import PublishingRequirement from '../../models/PublishingRequirement.js'
import Manuscript from '../../models/Manuscript.js'
import { authenticate } from '../../middleware/auth.js'
import { handleUpload } from '../../middleware/upload.js'

const router = Router()

/**
 * Get all active publishing requirements (Public/User Access)
 */
router.get('/requirements', async (req, res) => {
  try {
    const { field, search, page = 1, limit = 10 } = req.query
    
    const query = { status: 'active' }
    
    // Add field filter
    if (field) {
      query.field = field
    }
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Only show requirements with deadline in the future
    query.submissionDeadline = { $gte: new Date() }

    const requirements = await PublishingRequirement.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const count = await PublishingRequirement.countDocuments(query)

    res.json({
      success: true,
      data: {
        requirements
      },
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    })
  } catch (error) {
    console.error('Error fetching requirements:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch publishing requirements' 
    })
  }
})

/**
 * Get requirement by ID (Public)
 */
router.get('/requirements/:id', async (req, res) => {
  try {
    const requirement = await PublishingRequirement.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')

    if (!requirement) {
      return res.status(404).json({ 
        success: false, 
        message: 'Publishing requirement not found' 
      })
    }

    res.json({
      success: true,
      data: {
        requirement
      }
    })
  } catch (error) {
    console.error('Error fetching requirement:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch publishing requirement' 
    })
  }
})

/**
 * Submit manuscript (Authenticated)
 */
router.post('/manuscripts/submit', authenticate, handleUpload, async (req, res) => {
  try {
    console.log('\n=== 📄 BACKEND: MANUSCRIPT SUBMISSION START ===')
    console.log('Request body:', req.body)
    console.log('📝 Document type:', req.body.type || 'manuscript (default)')
    console.log('Request file:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file')
    console.log('Full req.user object:', JSON.stringify(req.user, null, 2))
    
    const { requirementId, title, abstract, authorName, authorEmail, affiliation, phone } = req.body

    // Validate required fields
    if (!requirementId || !title || !abstract || !authorName || !authorEmail) {
      console.error('❌ Missing required fields:', { requirementId, title, abstract, authorName, authorEmail })
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      })
    }

    // Build file object if file was uploaded
    let fileData = {}
    if (req.file) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'
      fileData = {
        url: `${backendUrl}/uploads/manuscripts/${req.file.filename}`,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      }
      console.log('📎 File data created:', fileData)
    }

    // Get user ID from token (handle both 'id' and 'userId' fields)
    const userId = req.user.userId || req.user.id || req.user._id
    console.log('🔑 Extracted user ID:', userId)
    console.log('🔑 User ID type:', typeof userId)
    
    if (!userId) {
      console.error('❌ No user ID found in token. req.user keys:', Object.keys(req.user))
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      })
    }

    const manuscriptData = {
      requirementId,
      title,
      abstract,
      author: {
        userId: userId,
        name: authorName,
        email: authorEmail,
        affiliation: affiliation || '',
        phone: phone || ''
      },
      file: fileData,
      type: req.body.type || 'manuscript', // Add type field for research-paper vs manuscript differentiation
      status: 'pending',
      submittedAt: new Date()
    }

    console.log('📝 Manuscript data to create:', JSON.stringify(manuscriptData, null, 2))

    const manuscript = await Manuscript.create(manuscriptData)

    console.log('✅ Manuscript created successfully!')
    console.log('   - ID:', manuscript._id)
    console.log('   - Type:', manuscript.type)
    console.log('   - Author UserID:', manuscript.author.userId)
    console.log('   - Status:', manuscript.status)

    // Update requirement manuscript count
    await PublishingRequirement.findByIdAndUpdate(
      requirementId,
      { $inc: { submissionsCount: 1 } }
    )

    res.status(201).json({
      success: true,
      data: {
        manuscript
      },
      message: 'Manuscript submitted successfully'
    })
  } catch (error) {
    console.error('❌ Error submitting manuscript:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to submit manuscript' 
    })
  }
})

/**
 * Get my manuscripts (Authenticated)
 */
router.get('/my-manuscripts', authenticate, async (req, res) => {
  try {
    // Get user ID from token (handle both 'id' and 'userId' fields)
    const userId = req.user.userId || req.user.id || req.user._id
    
    console.log('\n=== 📚 BACKEND: FETCHING MY MANUSCRIPTS ===')
    console.log('🔍 Raw user ID from token:', userId)
    console.log('🔍 User ID type:', typeof userId)
    console.log('🔍 Full user object:', req.user)
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      })
    }
    
    // Convert userId to ObjectId for querying (handle both string and ObjectId)
    const userIdForQuery = typeof userId === 'string' ? userId : userId.toString()
    console.log('🔍 User ID for query (string):', userIdForQuery)
    
    // Try querying with the string version (MongoDB can match ObjectId with string)
    const manuscripts = await Manuscript.find({ 'author.userId': userIdForQuery })
      .populate('requirementId', 'title topic field')
      .sort({ submittedAt: -1 })

    console.log('✅ Query executed')
    console.log('📊 Found manuscripts:', manuscripts.length)
    if (manuscripts.length > 0) {
      console.log('📋 First manuscript author.userId:', manuscripts[0].author.userId)
      console.log('📋 First manuscript details:', JSON.stringify(manuscripts[0], null, 2))
    } else {
      console.log('⚠️ No manuscripts found. Checking database...')
      // Get all manuscripts to debug
      const allManuscripts = await Manuscript.find({}).limit(3)
      console.log('📋 Total manuscripts in DB:', await Manuscript.countDocuments())
      if (allManuscripts.length > 0) {
        console.log('📋 Sample manuscript author.userId:', allManuscripts[0].author.userId)
        console.log('📋 Sample manuscript author.userId type:', typeof allManuscripts[0].author.userId)
      }
    }

    res.json({
      success: true,
      data: {
        manuscripts
      }
    })
  } catch (error) {
    console.error('❌ Error fetching manuscripts:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to fetch manuscripts' 
    })
  }
})

/**
 * Get manuscript by ID (Authenticated - own manuscripts only)
 */
router.get('/manuscripts/:id', authenticate, async (req, res) => {
  try {
    const manuscript = await Manuscript.findOne({
      _id: req.params.id,
      author: req.user.id
    }).populate('requirementId', 'title topic field')

    if (!manuscript) {
      return res.status(404).json({ 
        success: false, 
        message: 'Manuscript not found' 
      })
    }

    res.json({
      success: true,
      data: {
        manuscript
      }
    })
  } catch (error) {
    console.error('Error fetching manuscript:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch manuscript' 
    })
  }
})

/**
 * Delete manuscript (Authenticated - own manuscripts only)
 */
router.delete('/manuscripts/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id
    
    console.log('\n=== 🗑️ DELETE MANUSCRIPT REQUEST ===')
    console.log('Manuscript ID:', req.params.id)
    console.log('User ID from token:', userId)
    console.log('User object:', req.user)
    
    // Find manuscript first to check ownership
    const manuscript = await Manuscript.findById(req.params.id)
    
    if (!manuscript) {
      console.log('❌ Manuscript not found in database')
      return res.status(404).json({ 
        success: false, 
        message: 'Manuscript not found' 
      })
    }

    console.log('📄 Found manuscript:')
    console.log('   - Author UserID:', manuscript.author.userId)
    console.log('   - Author UserID type:', typeof manuscript.author.userId)
    console.log('   - Token UserID:', userId)
    console.log('   - Token UserID type:', typeof userId)
    
    // Convert both to strings for comparison
    const manuscriptUserId = manuscript.author.userId.toString()
    const tokenUserId = userId.toString()
    
    console.log('   - String comparison:', manuscriptUserId, '===', tokenUserId, '?', manuscriptUserId === tokenUserId)
    
    if (manuscriptUserId !== tokenUserId) {
      console.log('❌ User does not own this manuscript')
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to delete this manuscript' 
      })
    }

    // Delete the manuscript
    await Manuscript.findByIdAndDelete(req.params.id)
    
    console.log('✅ Manuscript deleted from database')
    
    // Decrement submission count on requirement
    if (manuscript.requirementId) {
      await PublishingRequirement.findByIdAndUpdate(
        manuscript.requirementId,
        { $inc: { submissionsCount: -1 } }
      )
      console.log('✅ Decremented submission count')
    }

    console.log('✅ Delete operation completed successfully')

    res.json({
      success: true,
      message: 'Manuscript deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting manuscript:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete manuscript: ' + error.message 
    })
  }
})

export default router
