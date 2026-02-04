import mongoose from 'mongoose'

const newsroomEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  theme: {
    type: String,
    required: true
  },
  eventType: {
    type: String,
    enum: ['contest', 'special-issue', 'collaboration', 'sponsored-writing'],
    default: 'contest'
  },
  // Submission rules
  wordLimit: {
    min: Number,
    max: Number
  },
  submissionRules: String,
  guidelines: String,
  // Tags and categories
  specialTags: [String],
  allowedCategories: [String],
  // Dates
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  announcementDate: Date,
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'completed', 'cancelled'],
    default: 'draft'
  },
  // Prizes and rewards
  prizes: [{
    position: String, // 'first', 'second', 'third', 'honorable-mention'
    description: String,
    value: String
  }],
  // Judging
  judges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  judgingCriteria: String,
  // Sponsorship
  sponsors: [{
    name: String,
    logo: String,
    website: String,
    description: String
  }],
  isSponsored: {
    type: Boolean,
    default: false
  },
  // Participation
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  submissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  }],
  maxParticipants: Number,
  participationFee: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Visibility
  isHighlighted: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredImage: String,
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Results
  winners: [{
    position: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article'
    }
  }],
  resultsPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
newsroomEventSchema.index({ status: 1 })
newsroomEventSchema.index({ startDate: 1 })
newsroomEventSchema.index({ endDate: 1 })
newsroomEventSchema.index({ eventType: 1 })

const NewsroomEvent = mongoose.model('NewsroomEvent', newsroomEventSchema)

export default NewsroomEvent
