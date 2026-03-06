import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import User from '../../models/User.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('Only image files are allowed!'))
  }
})

/**
 * Get user profile data
 * GET /api/user/profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    const user = await User.findById(userId).select('-password -otpCode')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    console.log('✅ Profile data fetched for user:', userId)

    res.json({
      success: true,
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        email: user.email,
        phone: user.profile?.phone || '',
        whatsapp: user.profile?.whatsapp || '',
        dob: user.profile?.dob || '',
        sex: user.profile?.sex || '',
        country: user.profile?.location?.country || '',
        state: user.profile?.location?.state || '',
        city: user.profile?.location?.city || '',
        avatar: user.profile?.avatar || '',
        photoURL: user.profile?.avatar || '',
        bio: user.profile?.bio || '',
        organization: user.profile?.organization || '',
        position: user.profile?.position || '',
        points: user.points || 0,
        role: user.role || 'user',
        consent: user.consent || false
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile data'
    })
  }
})

/**
 * Update user profile data
 * PUT /api/user/profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const updates = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Update profile fields
    if (updates.firstName) user.profile.firstName = updates.firstName
    if (updates.lastName) user.profile.lastName = updates.lastName
    if (updates.phone) user.profile.phone = updates.phone
    if (updates.whatsapp) user.profile.whatsapp = updates.whatsapp
    if (updates.dob) user.profile.dob = updates.dob
    if (updates.sex) user.profile.sex = updates.sex
    if (updates.bio) user.profile.bio = updates.bio
    if (updates.organization) user.profile.organization = updates.organization
    if (updates.position) user.profile.position = updates.position
    
    // Update location
    if (updates.country || updates.state || updates.city) {
      if (!user.profile.location) user.profile.location = {}
      if (updates.country) user.profile.location.country = updates.country
      if (updates.state) user.profile.location.state = updates.state
      if (updates.city) user.profile.location.city = updates.city
    }

    if (updates.consent !== undefined) user.consent = updates.consent

    await user.save()

    // Emit real-time update via Socket.IO
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('profile:updated', {
        profile: user.profile,
        message: 'Profile updated successfully'
      })
    }

    console.log('✅ Profile updated for user:', userId)

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: user.profile
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
})

/**
 * Upload user avatar
 * POST /api/user/profile/avatar
 */
router.post('/profile/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Store file path
    const avatarUrl = `/uploads/profiles/${req.file.filename}`
    user.profile.avatar = avatarUrl

    await user.save()

    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('profile:updated', {
        avatar: avatarUrl,
        message: 'Avatar updated successfully'
      })
    }

    console.log('✅ Avatar uploaded for user:', userId)

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl
    })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    })
  }
})

/**
 * Upload user CV/Resume
 * POST /api/user/profile/cv
 */
router.post('/profile/cv', authenticate, upload.single('cv'), async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const cvUrl = `/uploads/profiles/${req.file.filename}`
    user.profile.cv = {
      url: cvUrl,
      filename: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date()
    }

    await user.save()

    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('profile:updated', {
        cv: user.profile.cv,
        message: 'CV uploaded successfully'
      })
    }

    console.log('✅ CV uploaded for user:', userId)

    res.json({
      success: true,
      message: 'CV uploaded successfully',
      cv: user.profile.cv
    })
  } catch (error) {
    console.error('Error uploading CV:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload CV'
    })
  }
})

/**
 * Get user education data
 * GET /api/user/profile/education
 */
router.get('/profile/education', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    const user = await User.findById(userId).select('profile.education')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      education: user.profile?.education || {}
    })
  } catch (error) {
    console.error('Error fetching education data:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch education data'
    })
  }
})

/**
 * Update user education data
 * PUT /api/user/profile/education
 */
router.put('/profile/education', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const educationData = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.profile) user.profile = {}
    user.profile.education = {
      ...user.profile.education,
      ...educationData
    }

    await user.save()

    // Emit real-time update
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('profile:updated', {
        education: user.profile.education,
        message: 'Education data updated successfully'
      })
    }

    console.log('✅ Education data updated for user:', userId)

    res.json({
      success: true,
      message: 'Education data updated successfully',
      education: user.profile.education
    })
  } catch (error) {
    console.error('Error updating education data:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update education data'
    })
  }
})

export default router
