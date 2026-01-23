import { Router } from 'express'
import { requireAdmin } from '../../middleware/requireAdmin.js'
import * as adminController from '../../controllers/admin/adminController.js'
import User from '../../models/User.js'
import { getFirebaseUserByEmail, setUserAdminClaimByEmail } from '../../config/firebaseAdmin.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()

// ==================== ADMIN LOGIN (No Auth Required) ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    console.log('🔐 Admin login attempt:', { email, hasPassword: !!password })

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() })
    console.log('👤 User found:', user ? { email: user.email, role: user.role, status: user.status } : 'NOT FOUND')
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Check if user is admin
    console.log('🔍 Checking role:', { userRole: user.role, isAdmin: user.role === 'admin' })
    if (user.role !== 'admin') {
      console.log('❌ Access denied - user role is:', user.role)
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' })
    }
    console.log('✅ Admin role verified')

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not active' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        isAdmin: true, // Flag to indicate this is an admin token
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ success: false, message: 'Login failed' })
  }
})

// Protect all other routes under /api/admin with requireAdmin
router.use(requireAdmin)

// ==================== DASHBOARD ====================
router.get('/dashboard-stats', adminController.getDashboardStats)
router.get('/analytics', adminController.getAnalytics)

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getAllUsers)
router.patch('/users/:userId/status', adminController.updateUserStatus)
router.patch('/users/:userId/role', adminController.updateUserRole)
router.patch('/users/:userId/revoke-role', adminController.revokeUserRole)
router.delete('/users/:userId', adminController.deleteUser)

// ==================== JOB PORTAL MANAGEMENT ====================
router.get('/jobs', adminController.getAllJobsAdmin)
router.patch('/jobs/:jobId/status', adminController.updateJobStatus)
router.patch('/jobs/:jobId/featured', adminController.toggleJobFeatured)
router.delete('/jobs/:jobId', adminController.deleteJob)

// ==================== LEARNING CENTER MANAGEMENT ====================
router.get('/courses', adminController.getAllCoursesAdmin)
router.patch('/courses/:courseId/status', adminController.updateCourseStatus)
router.delete('/courses/:courseId', adminController.deleteCourse)

// ==================== NEWSROOM MANAGEMENT ====================
router.get('/articles', adminController.getAllArticlesAdmin)
router.patch('/articles/:articleId/status', adminController.updateArticleStatus)
router.delete('/articles/:articleId', adminController.deleteArticle)

// ==================== FORUM MANAGEMENT ====================
router.get('/threads', adminController.getAllThreadsAdmin)
router.patch('/threads/:threadId/flag', adminController.toggleThreadFlag)
router.delete('/threads/:threadId', adminController.deleteThread)

// ==================== PUBLISHING HOUSE MANAGEMENT ====================
// Publishing Requirements
router.post('/publishing-requirements', adminController.createPublishingRequirement)
router.get('/publishing-requirements', adminController.getAllPublishingRequirements)
router.patch('/publishing-requirements/:requirementId', adminController.updatePublishingRequirement)
router.delete('/publishing-requirements/:requirementId', adminController.deletePublishingRequirement)

// Manuscripts
router.get('/manuscripts', adminController.getAllManuscriptsOverview)
router.get('/manuscripts/requirement/:requirementId', adminController.getManuscriptsByRequirement)
router.patch('/manuscripts/:manuscriptId/review', adminController.reviewManuscript)
router.delete('/manuscripts/:manuscriptId', adminController.deleteManuscript)

// Research Papers
router.get('/research-papers', adminController.getAllResearchPapersOverview)

// ==================== ROLE REQUESTS MANAGEMENT ====================
router.get('/role-requests', adminController.getAllRoleRequests)
router.patch('/role-requests/:requestId', adminController.reviewRoleRequest)
router.patch('/role-requests/:requestId/review', adminController.reviewRoleRequest) // Legacy support
router.delete('/role-requests/:requestId', adminController.deleteRoleRequest)

// ==================== NETWORKING ARENA MANAGEMENT ====================
router.get('/connections', adminController.getAllConnectionsAdmin)
router.get('/groups', adminController.getAllGroupsAdmin)
router.delete('/groups/:groupId', adminController.deleteGroup)

// ----- Role management: Firebase custom claims -----
router.get('/roles/firebase', async (req, res) => {
	const { email } = req.query
	if (!email) return res.status(400).json({ message: 'email is required' })
	const result = await getFirebaseUserByEmail(email)
	if (result.success) return res.json(result.data)
	if (result.skipped) return res.status(500).json({ message: result.reason })
	return res.status(404).json({ message: result.error || 'not found' })
})

router.post('/roles/firebase/admin', async (req, res) => {
	const { email, admin } = req.body || {}
	if (!email || typeof admin !== 'boolean') return res.status(400).json({ message: 'email and admin (boolean) required' })
	const result = await setUserAdminClaimByEmail(email, admin)
	if (result.success) return res.json(result)
	if (result.skipped) return res.status(500).json({ message: result.reason })
	return res.status(500).json({ message: result.error || 'failed' })
})

// ----- Role management: MongoDB user.role -----
router.get('/roles/mongo', async (req, res) => {
	const { email } = req.query
	if (!email) return res.status(400).json({ message: 'email is required' })
	const user = await User.findOne({ email: String(email).toLowerCase() })
	if (!user) return res.status(404).json({ message: 'not found' })
	return res.json({ email: user.email, role: user.role })
})

router.post('/roles/mongo', async (req, res) => {
	const { email, role } = req.body || {}
	if (!email || !role) return res.status(400).json({ message: 'email and role required' })
	if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'invalid role' })
	const user = await User.findOneAndUpdate(
		{ email: String(email).toLowerCase() },
		{ $set: { role } },
		{ new: true, upsert: true }
	)
	return res.json({ email: user.email, role: user.role })
})

// Convenience endpoint: sync both sources
router.post('/roles/admin-sync', async (req, res) => {
	const { email, admin } = req.body || {}
	if (!email || typeof admin !== 'boolean') return res.status(400).json({ message: 'email and admin (boolean) required' })
	const mongo = await User.findOneAndUpdate(
		{ email: String(email).toLowerCase() },
		{ $set: { role: admin ? 'admin' : 'user' } },
		{ new: true, upsert: true }
	)
	const fb = await setUserAdminClaimByEmail(email, admin)
	return res.json({ mongo: { email: mongo.email, role: mongo.role }, firebase: fb })
})

export default router
