import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import { handleArticleUpload } from '../../middleware/upload.js'
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  getUserArticles,
  approveArticle,
  rejectArticle,
  getPendingArticles,
  getPublishedArticles,
  likeArticle,
  dislikeArticle,
  addComment,
  deleteComment,
  flagArticle,
  incrementShareCount,
  getArticleStats
} from '../../controllers/newsroom/articleController.js'

const router = express.Router()

/**
 * Public routes
 */
// Get all articles (with filtering)
router.get('/', getArticles)

// Get published articles only
router.get('/published', getPublishedArticles)

/**
 * Authenticated routes (specific routes must come before parameterized routes)
 */
// Create new article (with file upload for featured image)
router.post('/', authenticate, handleArticleUpload, createArticle)

// Get user's own articles - MUST be before /:id route
router.get('/user/my-articles', authenticate, getUserArticles)

// Get article stats - MUST be before /:id route
router.get('/:id/stats', getArticleStats)

// Get single article by ID (public) - keep this after specific routes
router.get('/:id', getArticleById)

// Update article
router.put('/:id', authenticate, handleArticleUpload, updateArticle)

// Delete article
router.delete('/:id', authenticate, deleteArticle)

// Like article
router.post('/:id/like', authenticate, likeArticle)

// Dislike article
router.post('/:id/dislike', authenticate, dislikeArticle)

// Add comment
router.post('/:id/comments', authenticate, addComment)

// Delete comment
router.delete('/:id/comments/:commentId', authenticate, deleteComment)

// Flag article
router.post('/:id/flag', authenticate, flagArticle)

// Increment share count
router.post('/:id/share', incrementShareCount)

/**
 * Admin routes (must be before /:id routes)
 */
// Get pending articles (admin)
router.get('/admin/pending', authenticate, getPendingArticles)

// Approve article (admin) - must be before generic /:id routes
router.post('/:id/approve', authenticate, approveArticle)

// Reject article (admin) - must be before generic /:id routes
router.post('/:id/reject', authenticate, rejectArticle)

export default router
