import express from 'express';
import { authenticate, authenticateOptional } from '../../middleware/auth.js';
import {
  createForum,
  getForums,
  getForum,
  toggleFollowForum,
  getTrendingForums,
  checkTitleUniqueness,
  getUserForums,
  getForumStatusCounts
} from '../../controllers/forum/forumController.js';

const router = express.Router();

// Public routes
router.get('/', getForums);
router.get('/list', getForums);
router.get('/trending', getTrendingForums);
router.get('/check-title/:title', checkTitleUniqueness);
router.get('/status/counts', authenticateOptional, getForumStatusCounts);
router.get('/:id', getForum);

// Protected routes (require authentication)
router.post('/create', authenticate, createForum);
router.post('/:forumId/follow', authenticate, toggleFollowForum);
router.get('/user/my-forums', authenticate, getUserForums);

export default router;
