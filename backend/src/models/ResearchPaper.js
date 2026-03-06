import mongoose from 'mongoose'

const researchPaperSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  authors: {
    type: String,
    required: true,
    trim: true
  },
  affiliation: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  abstract: {
    type: String,
    required: true
  },
  keywords: {
    type: String,
    default: ''
  },
  introduction: {
    type: String,
    default: ''
  },
  relatedWork: {
    type: String,
    default: ''
  },
  methodology: {
    type: String,
    default: ''
  },
  results: {
    type: String,
    default: ''
  },
  discussion: {
    type: String,
    default: ''
  },
  conclusion: {
    type: String,
    default: ''
  },
  references: {
    type: String,
    default: ''
  },
  acknowledgments: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['research-paper', 'manuscript'],
    default: 'manuscript'
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'pending', 'under-review', 'accepted', 'rejected'],
    default: 'draft'
  },
  lastEditedAt: {
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
  },
  adminRemarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // This adds createdAt and updatedAt
})

// Index for faster queries
researchPaperSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('ResearchPaper', researchPaperSchema)
