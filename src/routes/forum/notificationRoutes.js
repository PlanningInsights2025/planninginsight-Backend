import express from 'express';
import { authenticate } from '../../middleware/auth.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../../controllers/forum/notificationController.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.put('/:notificationId/read', authenticate, markAsRead);
router.put('/read-all', authenticate, markAllAsRead);
router.delete('/:notificationId', authenticate, deleteNotification);

export default router;
