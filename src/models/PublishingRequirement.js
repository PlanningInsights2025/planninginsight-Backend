import mongoose from 'mongoose'

const publishingRequirementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: String,
    trim: true
  },
  field: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  guidelines: {
    format: {
      type: String,
      trim: true
    },
    wordLimit: {
      type: String,
      trim: true
    },
    citationStyle: {
      type: String,
      trim: true
    },
    other: {
      type: String,
      trim: true
    }
  },
  submissionDeadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  submissionFee: {
    type: Number,
    default: 0
  },
  publicationFee: {
    type: Number,
    default: 0
  },
  reviewProcess: {
    type: String,
    enum: ['single-blind', 'double-blind', 'open', 'editorial'],
    default: 'double-blind'
  },
  expectedPublicationDate: {
    type: Date
  },
  specialIssue: {
    type: Boolean,
    default: false
  },
  guestEditors: [{
    name: String,
    email: String,
    affiliation: String
  }],
  contactEmail: {
    type: String
  },
  submissionsCount: {
    type: Number,
    default: 0
  },
  acceptedCount: {
    type: Number,
    default: 0
  },
  rejectedCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for better query performance
publishingRequirementSchema.index({ status: 1, submissionDeadline: 1 })
publishingRequirementSchema.index({ field: 1 })
publishingRequirementSchema.index({ topic: 1 })
publishingRequirementSchema.index({ createdBy: 1 })

// Virtual for checking if deadline has passed
publishingRequirementSchema.virtual('isExpired').get(function() {
  return this.submissionDeadline && this.submissionDeadline < new Date()
})

// Virtual for acceptance rate
publishingRequirementSchema.virtual('acceptanceRate').get(function() {
  if (this.submissionsCount === 0) return 0
  return ((this.acceptedCount / this.submissionsCount) * 100).toFixed(2)
})

// Method to increment submission count
publishingRequirementSchema.methods.incrementSubmissions = function() {
  this.submissionsCount += 1
  return this.save()
}

// Method to update review status counts
publishingRequirementSchema.methods.updateReviewCounts = function(status) {
  if (status === 'accepted') {
    this.acceptedCount += 1
  } else if (status === 'rejected') {
    this.rejectedCount += 1
  }
  return this.save()
}

// Static method to get active requirements
publishingRequirementSchema.statics.getActiveRequirements = function() {
  return this.find({
    status: 'active',
    submissionDeadline: { $gt: new Date() }
  }).sort({ submissionDeadline: 1 })
}

// Pre-save middleware to auto-close expired requirements
publishingRequirementSchema.pre('save', function(next) {
  if (this.submissionDeadline && this.submissionDeadline < new Date() && this.status === 'active') {
    this.status = 'closed'
  }
  next()
})

const PublishingRequirement = mongoose.model('PublishingRequirement', publishingRequirementSchema)

export default PublishingRequirement
