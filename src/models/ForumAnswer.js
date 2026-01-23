import mongoose from 'mongoose';

const forumAnswerSchema = new mongoose.Schema({
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumThread',
    required: true,
    index: true
  },
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true,
    index: true
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
  isAccepted: {
    type: Boolean,
    default: false
  },
  acceptedAt: Date,

  // Reactions
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

  // Comments
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date,
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],

  // Moderation
  status: {
    type: String,
    enum: ['active', 'deleted', 'flagged'],
    default: 'active'
  },
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

  // Metadata
  editHistory: [{
    editedAt: Date,
    previousContent: String
  }]
}, {
  timestamps: true
});

// Indexes
forumAnswerSchema.index({ thread: 1, createdAt: 1 });
forumAnswerSchema.index({ thread: 1, voteScore: -1 });
forumAnswerSchema.index({ thread: 1, isAccepted: -1 });
forumAnswerSchema.index({ author: 1, createdAt: -1 });
forumAnswerSchema.index({ forum: 1, createdAt: -1 });

// Virtual for comment count
forumAnswerSchema.virtual('commentCount').get(function() {
  return this.comments?.length || 0;
});

// Virtual for total votes
forumAnswerSchema.virtual('totalVotes').get(function() {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Update vote score before saving
forumAnswerSchema.pre('save', function(next) {
  this.voteScore = (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
  next();
});

const ForumAnswer = mongoose.model('ForumAnswer', forumAnswerSchema);

export default ForumAnswer;
