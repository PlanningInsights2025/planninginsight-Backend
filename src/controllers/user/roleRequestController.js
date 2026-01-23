import RoleRequest from '../../models/RoleRequest.js'
import User from '../../models/User.js'

/**
 * Submit a role upgrade request
 */
export const submitRoleRequest = async (req, res) => {
  try {
    const { requestedRole, reason } = req.body
    const userId = req.user.userId || req.user.id

    // Validate requested role
    if (!['recruiter', 'instructor', 'editor', 'chiefeditor'].includes(requestedRole)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role requested' 
      })
    }

    // Validate reason
    if (!reason || !reason.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a reason for your request' 
      })
    }

    // Check if user already has this role
    const user = await User.findById(userId)
    if (user.role === requestedRole) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have this role' 
      })
    }

    // Check if there's already a pending request
    const existingRequest = await RoleRequest.findOne({
      userId: userId,
      requestedRole: requestedRole,
      status: 'pending'
    })

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending request for this role' 
      })
    }

    // Create new role request
    const roleRequest = await RoleRequest.create({
      userId: userId,
      requestedRole: requestedRole,
      reason: reason.trim()
    })

    await roleRequest.populate('userId', 'name email profile')

    res.status(201).json({
      success: true,
      message: 'Role upgrade request submitted successfully',
      data: roleRequest
    })
  } catch (error) {
    console.error('Error submitting role request:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit role request' 
    })
  }
}

/**
 * Get user's role requests
 */
export const getMyRoleRequests = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    const requests = await RoleRequest.find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email')

    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('Error fetching role requests:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch role requests' 
    })
  }
}
