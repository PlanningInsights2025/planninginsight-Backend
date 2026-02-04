import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['professional', 'academic', 'research', 'community', 'interest', 'project', 'other']
  },
  type: {
    type: String,
    enum: ['public', 'private', 'secret'],
    default: 'public'
  },
  avatar: {
    type: String
  },
  coverImage: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  memberCount: {
    type: Number,
    default: 0
  },
  pendingRequests: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  postCount: {
    type: Number,
    default: 0
  },
  rules: [{
    title: String,
    description: String
  }],
  settings: {
    allowMemberPosts: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowInvites: {
      type: Boolean,
      default: true
    },
    allowDiscussions: {
      type: Boolean,
      default: true
    },
    allowEvents: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'suspended'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Indexes
groupSchema.index({ name: 'text', description: 'text' })
groupSchema.index({ category: 1, type: 1 })
groupSchema.index({ createdBy: 1 })
groupSchema.index({ 'members.user': 1 })
groupSchema.index({ status: 1 })
groupSchema.index({ featured: 1 })
groupSchema.index({ tags: 1 })

// Virtual for checking if group is public
groupSchema.virtual('isPublic').get(function() {
  return this.type === 'public'
})

// Method to add member
groupSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.equals(userId))
  
  if (!existingMember) {
    this.members.push({
      user: userId,
      role,
      joinedAt: new Date()
    })
    this.memberCount = this.members.length
    
    if (role === 'admin') {
      this.admins.push(userId)
    } else if (role === 'moderator') {
      this.moderators.push(userId)
    }
  }
  
  return this.save()
}

// Method to remove member
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => !m.user.equals(userId))
  this.admins = this.admins.filter(id => !id.equals(userId))
  this.moderators = this.moderators.filter(id => !id.equals(userId))
  this.memberCount = this.members.length
  
  return this.save()
}

// Method to update member role
groupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(m => m.user.equals(userId))
  
  if (member) {
    // Remove from old role arrays
    this.admins = this.admins.filter(id => !id.equals(userId))
    this.moderators = this.moderators.filter(id => !id.equals(userId))
    
    // Update role
    member.role = newRole
    
    // Add to new role array
    if (newRole === 'admin') {
      this.admins.push(userId)
    } else if (newRole === 'moderator') {
      this.moderators.push(userId)
    }
  }
  
  return this.save()
}

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.equals(userId))
}

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  return this.admins.some(id => id.equals(userId)) || this.createdBy.equals(userId)
}

// Method to check if user is moderator
groupSchema.methods.isModerator = function(userId) {
  return this.moderators.some(id => id.equals(userId))
}

// Method to approve join request
groupSchema.methods.approveRequest = function(userId) {
  this.pendingRequests = this.pendingRequests.filter(r => !r.user.equals(userId))
  return this.addMember(userId, 'member')
}

// Method to reject join request
groupSchema.methods.rejectRequest = function(userId) {
  this.pendingRequests = this.pendingRequests.filter(r => !r.user.equals(userId))
  return this.save()
}

// Method to increment post count
groupSchema.methods.incrementPosts = function() {
  this.postCount += 1
  this.stats.totalPosts += 1
  this.lastActivity = new Date()
  return this.save()
}

// Method to update activity
groupSchema.methods.updateActivity = function() {
  this.lastActivity = new Date()
  return this.save()
}

// Static method to find groups by user membership
groupSchema.statics.findByMember = function(userId) {
  return this.find({
    'members.user': userId,
    status: 'active'
  }).sort({ lastActivity: -1 })
}

// Static method to find featured groups
groupSchema.statics.findFeatured = function() {
  return this.find({
    featured: true,
    status: 'active'
  }).sort({ memberCount: -1 }).limit(10)
}

// Pre-save middleware to initialize admins array
groupSchema.pre('save', function(next) {
  if (this.isNew) {
    if (!this.admins.includes(this.createdBy)) {
      this.admins.push(this.createdBy)
    }
    
    // Add creator as first member
    const creatorAsMember = this.members.find(m => m.user.equals(this.createdBy))
    if (!creatorAsMember) {
      this.members.push({
        user: this.createdBy,
        role: 'admin',
        joinedAt: new Date()
      })
      this.memberCount = this.members.length
    }
  }
  next()
})

const Group = mongoose.model('Group', groupSchema)

export default Group
