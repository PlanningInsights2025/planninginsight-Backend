import ForumNotification from '../../models/ForumNotification.js';
import { emitToUser } from '../../config/socket.js';
import { sendEmail } from '../../services/email/emailService.js';
import User from '../../models/User.js';

/**
 * Create a notification
 */
export const createNotification = async (notificationData) => {
  try {
    const notification = new ForumNotification(notificationData);
    await notification.save();

    // Get recipient user for email preference
    const recipient = await User.findById(notificationData.recipient);
    
    // Real-time web notification
    emitToUser(notificationData.recipient, 'notification:new', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt
    });

    // Send email if user preferences allow
    if (recipient?.preferences?.emailNotifications && notificationData.deliveryMethod !== 'web') {
      try {
        await sendEmail({
          to: recipient.email,
          subject: notification.title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              <a href="${process.env.FRONTEND_URL}${notification.actionUrl}" 
                 style="display: inline-block; padding: 12px 24px; background: #524393; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
                View Details
              </a>
            </div>
          `
        });

        notification.emailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Get user notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      ForumNotification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sender', 'name avatar')
        .populate('forum', 'title')
        .populate('thread', 'title')
        .lean(),
      ForumNotification.countDocuments(query),
      ForumNotification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await ForumNotification.findOne({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req, res) => {
  try {
    await ForumNotification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await ForumNotification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

export default {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
