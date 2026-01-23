import mongoose from 'mongoose'

const connectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  },
  requestMessage: {
    type: String,
    trim: true
  },
  connectionType: {
    type: String,
    enum: ['colleague', 'collaborator', 'mentor', 'mentee', 'friend', 'other'],
    default: 'colleague'
  },
  mutualConnections: {
    type: Number,
    default: 0
  },
  interactionCount: {
    type: Number,
    default: 0
  },
  lastInteraction: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String
  }
}, {
  timestamps: true
})

// Compound index to ensure unique connections
connectionSchema.index({ user: 1, connectedUser: 1 }, { unique: true })

// Index for status queries
connectionSchema.index({ status: 1 })

// Index for user queries
connectionSchema.index({ user: 1, status: 1 })
connectionSchema.index({ connectedUser: 1, status: 1 })

// Virtual to check if connection is active
connectionSchema.virtual('isActive').get(function() {
  return this.status === 'accepted'
})

// Method to accept connection
connectionSchema.methods.accept = function() {
  this.status = 'accepted'
  return this.save()
}

// Method to reject connection
connectionSchema.methods.reject = function() {
  this.status = 'rejected'
  return this.save()
}

// Method to block connection
connectionSchema.methods.block = function() {
  this.status = 'blocked'
  return this.save()
}

// Method to record interaction
connectionSchema.methods.recordInteraction = function() {
  this.interactionCount += 1
  this.lastInteraction = new Date()
  return this.save()
}

// Static method to find mutual connections
connectionSchema.statics.findMutualConnections = async function(userId1, userId2) {
  const user1Connections = await this.find({ 
    user: userId1, 
    status: 'accepted' 
  }).select('connectedUser')
  
  const user2Connections = await this.find({ 
    user: userId2, 
    status: 'accepted' 
  }).select('connectedUser')
  
  const user1ConnIds = user1Connections.map(c => c.connectedUser.toString())
  const user2ConnIds = user2Connections.map(c => c.connectedUser.toString())
  
  return user1ConnIds.filter(id => user2ConnIds.includes(id))
}

// Static method to get connection status between two users
connectionSchema.statics.getConnectionStatus = async function(userId1, userId2) {
  const connection = await this.findOne({
    $or: [
      { user: userId1, connectedUser: userId2 },
      { user: userId2, connectedUser: userId1 }
    ]
  })
  
  return connection ? connection.status : 'none'
}

// Pre-save middleware to prevent self-connections
connectionSchema.pre('save', function(next) {
  if (this.user.equals(this.connectedUser)) {
    next(new Error('Cannot connect to yourself'))
  } else {
    next()
  }
})

const Connection = mongoose.model('Connection', connectionSchema)

export default Connection
