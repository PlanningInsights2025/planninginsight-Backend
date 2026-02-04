import mongoose from 'mongoose';

const forumPollSchema = new mongoose.Schema({
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true,
    index: true
  },
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumThread'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: String,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Poll options
  options: [{
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    voteCount: {
      type: Number,
      default: 0
    }
  }],

  // Settings
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  allowAddOptions: {
    type: Boolean,
    default: false
  },
  showResultsBeforeVote: {
    type: Boolean,
    default: false
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },

  // Timing
  endsAt: Date,
  isClosed: {
    type: Boolean,
    default: false
  },

  // Collaboration
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Analytics
  totalVotes: {
    type: Number,
    default: 0
  },
  uniqueVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'closed', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
forumPollSchema.index({ forum: 1, createdAt: -1 });
forumPollSchema.index({ thread: 1 });
forumPollSchema.index({ creator: 1, createdAt: -1 });
forumPollSchema.index({ endsAt: 1, isClosed: 1 });

// Virtual for total unique voters
forumPollSchema.virtual('voterCount').get(function() {
  return this.uniqueVoters?.length || 0;
});

// Update total votes before saving
forumPollSchema.pre('save', function(next) {
  this.totalVotes = this.options.reduce((sum, option) => sum + (option.voteCount || 0), 0);
  next();
});

// Auto-close expired polls
forumPollSchema.pre('save', function(next) {
  if (this.endsAt && new Date() > this.endsAt && !this.isClosed) {
    this.isClosed = true;
    this.status = 'closed';
  }
  next();
});

const ForumPoll = mongoose.model('ForumPoll', forumPollSchema);

export default ForumPoll;
