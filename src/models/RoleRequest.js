import mongoose from 'mongoose'

const roleRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['recruiter', 'instructor', 'editor', 'chiefeditor'],
    required: true
  },
  reason: {
    type: String,
    required: false // Not required in schema for backwards compatibility, but validated in controller for new requests
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
})

// Index for faster queries
roleRequestSchema.index({ userId: 1, status: 1 })
roleRequestSchema.index({ status: 1, createdAt: -1 })

const RoleRequest = mongoose.model('RoleRequest', roleRequestSchema)

export default RoleRequest
