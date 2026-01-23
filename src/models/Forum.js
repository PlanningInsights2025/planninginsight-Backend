import mongoose from 'mongoose'

const forumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // No special characters except spaces, hyphens, and underscores
        return /^[a-zA-Z0-9\s\-_]+$/.test(v)
      },
      message: 'Forum title can only contain letters, numbers, spaces, hyphens, and underscores'
    }
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Urban Design', 'Mobility', 'Heritage', 'Sustainability', 'Infrastructure', 'Housing', 'Policy', 'Technology', 'Other']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  motivation: {
    type: String,
    required: false,
    minlength: 10,
    maxlength: 1000
  },
  intent: {
    type: String,
    required: false,
    minlength: 10,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followerCount: {
    type: Number,
    default: 0
  },
  questionCount: {
    type: Number,
    default: 0
  },
  answerCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  tags: [String],
  metadata: {
    lastActivityAt: Date,
    trendingScore: {
      type: Number,
      default: 0
    },
    qualityScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
})

// Indexes for performance
forumSchema.index({ title: 'text', description: 'text', tags: 'text' })
forumSchema.index({ status: 1, createdAt: -1 })
forumSchema.index({ category: 1, status: 1 })
forumSchema.index({ 'metadata.trendingScore': -1 })

// Generate slug before saving
forumSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
  next()
})

const Forum = mongoose.model('Forum', forumSchema)

export default Forum
