import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  createThread,
  getThreads,
  getThread,
  createAnswer,
  voteThread,
  voteAnswer,
  acceptAnswer,
  addComment,
  toggleFollowThread
} from '../../controllers/forum/forumThreadController.js';

const router = express.Router();

// Thread routes
router.post('/:forumId/threads', authenticate, createThread);
router.get('/:forumId/threads', getThreads);
router.get('/threads/:threadId', getThread);
router.post('/threads/:threadId/follow', authenticate, toggleFollowThread);
router.post('/threads/:threadId/vote', authenticate, voteThread);

// Answer routes
router.post('/threads/:threadId/answers', authenticate, createAnswer);
router.post('/answers/:answerId/vote', authenticate, voteAnswer);
router.post('/threads/:threadId/answers/:answerId/accept', authenticate, acceptAnswer);

// Comment routes
router.post('/answers/:answerId/comments', authenticate, addComment);

export default router;
