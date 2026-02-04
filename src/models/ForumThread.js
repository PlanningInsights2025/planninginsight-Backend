import mongoose from 'mongoose';

const forumThreadSchema = new mongoose.Schema({
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isQuestion: {
    type: Boolean,
    default: false
  },
  hasAcceptedAnswer: {
    type: Boolean,
    default: false
  },
  acceptedAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumAnswer'
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'deleted', 'flagged'],
    default: 'active'
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Engagement metrics
  viewCount: {
    type: Number,
    default: 0
  },
  answerCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  voteScore: {
    type: Number,
    default: 0
  },

  // Metadata
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  trendingScore: {
    type: Number,
    default: 0
  },

  // Moderation
  flags: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    description: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date
  }],

  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Compound indexes for performance
forumThreadSchema.index({ forum: 1, createdAt: -1 });
forumThreadSchema.index({ forum: 1, isPinned: -1, lastActivityAt: -1 });
forumThreadSchema.index({ forum: 1, trendingScore: -1 });
forumThreadSchema.index({ author: 1, createdAt: -1 });
forumThreadSchema.index({ status: 1, createdAt: -1 });
forumThreadSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Virtual for follower count
forumThreadSchema.virtual('followerCount').get(function() {
  return this.followers?.length || 0;
});

// Virtual for total votes
forumThreadSchema.virtual('totalVotes').get(function() {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Generate slug before saving
forumThreadSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    const baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 60);
    
    this.slug = `${baseSlug}-${this._id.toString().substring(0, 8)}`;
  }
  next();
});

// Calculate trending score before saving
forumThreadSchema.pre('save', function(next) {
  const ageInHours = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  const voteScore = this.voteScore || 0;
  const engagementScore = (this.answerCount * 5) + (this.commentCount * 2) + (this.viewCount * 0.1);
  
  // Trending score decreases with age
  this.trendingScore = (voteScore + engagementScore) / Math.pow(ageInHours + 2, 1.5);
  next();
});

const ForumThread = mongoose.model('ForumThread', forumThreadSchema);

export default ForumThread;
