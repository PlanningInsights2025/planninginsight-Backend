import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'published', 'archived'],
    default: 'draft'
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needsModification'],
    default: 'pending'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  featuredImage: String,
  uploadedFiles: [{
    filename: String,
    url: String,
    type: String,
    size: Number
  }],
  mediaFiles: [{
    filename: String,
    url: String,
    type: String, // 'video', 'image', 'document'
    size: Number
  }],
  wordCount: {
    type: Number,
    default: 0
  },
  plagiarismScore: {
    type: Number,
    default: 0
  },
  plagiarismReport: {
    checked: Boolean,
    score: Number,
    wordCount: Number,
    matchedSources: [{
      url: String,
      matchPercentage: Number
    }],
    checkedAt: Date
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  coAuthors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String, // For inviting unregistered users
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  }],
  // Like/Dislike functionality
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  dislikesCount: {
    type: Number,
    default: 0
  },
  // Comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  // Flags/Reports
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Subscription and access control
  subscriptionOnly: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  // Citation information
  citationText: String,
  doi: String, // Digital Object Identifier
  // Review process
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  rejectionReason: String,
  modificationNotes: String,
  // Publishing
  publishedAt: Date,
  archivedAt: Date,
  // Social sharing
  shareCount: {
    type: Number,
    default: 0
  },
  // Special events/contests
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsroomEvent'
  },
  isContestEntry: {
    type: Boolean,
    default: false
  },
  // Content protection
  preventCopy: {
    type: Boolean,
    default: true
  },
  preventScreenshot: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Indexes for better query performance
articleSchema.index({ status: 1 })
articleSchema.index({ approvalStatus: 1 })
articleSchema.index({ author: 1 })
articleSchema.index({ category: 1 })
articleSchema.index({ tags: 1 })

const Article = mongoose.model('Article', articleSchema)

export default Article
