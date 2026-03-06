import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import { submitAppeal } from '../../controllers/forum/moderationController.js';

const router = express.Router();

// Submit an appeal for a moderation decision
router.post('/submit', authenticate, submitAppeal);

export default router;
