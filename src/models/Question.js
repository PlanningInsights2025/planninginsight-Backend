import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  forum: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 300
  },
  content: {
    type: String,
    required: true,
    minlength: 20
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
  tags: [String],
  images: [{
    url: String,
    verified: {
      type: Boolean,
      default: false
    }
  }],
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
  views: {
    type: Number,
    default: 0
  },
  answerCount: {
    type: Number,
    default: 0
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followerCount: {
    type: Number,
    default: 0
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'removed'],
    default: 'active'
  },
  bestAnswer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Answer'
  },
  metadata: {
    lastActivityAt: Date,
    qualityScore: {
      type: Number,
      default: 0
    },
    wordCount: Number
  }
}, {
  timestamps: true
})

// Indexes
questionSchema.index({ forum: 1, createdAt: -1 })
questionSchema.index({ author: 1, createdAt: -1 })
questionSchema.index({ title: 'text', content: 'text', tags: 'text' })
questionSchema.index({ 'metadata.lastActivityAt': -1 })
questionSchema.index({ likesCount: -1 })

// Calculate word count before saving
questionSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.metadata.wordCount = this.content.split(/\s+/).length
  }
  next()
})

const Question = mongoose.model('Question', questionSchema)

export default Question
