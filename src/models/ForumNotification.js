import mongoose from 'mongoose';

const forumNotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'new_thread',
      'new_answer',
      'new_comment',
      'thread_upvote',
      'answer_upvote',
      'answer_accepted',
      'thread_reply',
      'mention',
      'forum_approved',
      'forum_rejected',
      'thread_followed',
      'forum_followed',
      'moderation_action',
      'appeal_update',
      'poll_created',
      'poll_ending'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // References
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum'
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumThread'
  },
  answer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumAnswer'
  },
  poll: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPoll'
  },

  // URL for navigation
  actionUrl: String,

  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Delivery
  deliveryMethod: {
    type: String,
    enum: ['web', 'email', 'both'],
    default: 'web'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,

  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Indexes
forumNotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
forumNotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
forumNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // Auto-delete after 90 days

const ForumNotification = mongoose.model('ForumNotification', forumNotificationSchema);

export default ForumNotification;
