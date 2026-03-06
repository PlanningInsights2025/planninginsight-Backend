import mongoose from 'mongoose'

const manuscriptSchema = new mongoose.Schema({
  requirementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PublishingRequirement',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  abstract: {
    type: String,
    required: true
  },
  author: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    affiliation: String,
    phone: String
  },
  file: {
    url: String,
    filename: String,
    fileType: String,
    fileSize: Number
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'under-review'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['manuscript', 'research-paper'],
    default: 'manuscript'
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Editor Assignment Fields
  assignedEditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  editorRemarks: {
    type: String,
    default: ''
  },
  editorReviewedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
})

manuscriptSchema.index({ requirementId: 1, status: 1 })
manuscriptSchema.index({ 'author.userId': 1 })
manuscriptSchema.index({ assignedEditor: 1, status: 1 })
manuscriptSchema.index({ status: 1, type: 1 })
manuscriptSchema.index({ type: 1, assignedEditor: 1 })

const Manuscript = mongoose.model('Manuscript', manuscriptSchema)

export default Manuscript
