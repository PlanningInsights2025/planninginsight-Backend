import mongoose from 'mongoose';

const forumReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Target content
  targetType: {
    type: String,
    required: true,
    enum: ['thread', 'answer', 'comment', 'forum']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    index: true
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumThread'
  },

  // Report details
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'inappropriate_content',
      'misinformation',
      'off_topic',
      'hate_speech',
      'personal_information',
      'copyright',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Moderation
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  resolution: {
    action: {
      type: String,
      enum: ['no_action', 'warning', 'content_removed', 'user_suspended', 'user_banned']
    },
    notes: String,
    actionTakenAt: Date
  },

  // Appeal
  appeal: {
    submitted: {
      type: Boolean,
      default: false
    },
    appealText: String,
    appealedAt: Date,
    appealStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    appealReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appealReviewedAt: Date,
    appealNotes: String
  },

  // Metadata
  contentSnapshot: String, // Store original content
  reportCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes
forumReportSchema.index({ status: 1, priority: -1, createdAt: -1 });
forumReportSchema.index({ forum: 1, status: 1 });
forumReportSchema.index({ reportedUser: 1, createdAt: -1 });
forumReportSchema.index({ assignedTo: 1, status: 1 });

const ForumReport = mongoose.model('ForumReport', forumReportSchema);

export default ForumReport;
