import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import { requireAdmin } from '../../middleware/requireAdmin.js'
import {
  getAllFlags,
  getAnonymousIdentity,
  resolveFlag,
  submitAppeal,
  reviewAppeal
} from '../../controllers/forum/moderationController.js'
import {
  createPoll,
  getPollAnalytics,
  closePoll
} from '../../controllers/forum/pollController.js'
import {
  getPendingForums,
  approveForum,
  rejectForum,
  getAllForumsAdmin
} from '../../controllers/admin/adminController.js'

const router = express.Router()

// All admin routes require authentication and admin role
router.use(authenticate)
router.use(requireAdmin)

// ==================== FORUM APPROVAL ====================

// Get pending forums
router.get('/forums/pending', getPendingForums)

// Get all forums (admin view)
router.get('/forums', getAllForumsAdmin)

// Approve forum
router.put('/forum/:forumId/approve', approveForum)

// Reject forum
router.put('/forum/:forumId/reject', rejectForum)

// ==================== MODERATION ====================

// Get all flags
router.get('/flags', getAllFlags)

// Get anonymous user identity
router.get('/flag/:contentType/:contentId/identity', getAnonymousIdentity)

// Resolve a flag
router.post('/flag/:flagId/resolve', resolveFlag)

// Review an appeal
router.post('/flag/:flagId/appeal/review', reviewAppeal)

// ==================== POLL MANAGEMENT ====================

// Create poll (admin only)
router.post('/poll/create', createPoll)

// Get poll analytics
router.get('/poll/:pollId/analytics', getPollAnalytics)

// Close poll
router.put('/poll/:pollId/close', closePoll)

export default router
