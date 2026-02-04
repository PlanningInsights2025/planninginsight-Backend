import User from '../../models/User.js'
import Job from '../../models/Job.js'
import Course from '../../models/Course.js'
import Article from '../../models/Article.js'
import Thread from '../../models/ForumThread.js'
import Manuscript from '../../models/Manuscript.js'
import ResearchPaper from '../../models/ResearchPaper.js'
import PublishingRequirement from '../../models/PublishingRequirement.js'
import Connection from '../../models/Connection.js'
import Group from '../../models/Group.js'
import Forum from '../../models/Forum.js'
import Question from '../../models/Question.js'
import RoleRequest from '../../models/RoleRequest.js'
import { sendMail } from '../../config/email.js'
import { sendEmail } from '../../services/email/emailService.js'

/**
 * Admin Controller
 * Handles all admin-related operations
 */

// ==================== DASHBOARD ====================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalCourses,
      totalArticles,
      totalThreads,
      totalManuscripts,
      totalConnections,
      totalGroups
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Course.countDocuments(),
      Article.countDocuments(),
      Thread.countDocuments(),
      Manuscript.countDocuments(),
      Connection.countDocuments(),
      Group.countDocuments()
    ])

    res.json({
      success: true,
      stats: {
        users: totalUsers,
        jobs: totalJobs,
        courses: totalCourses,
        articles: totalArticles,
        threads: totalThreads,
        manuscripts: totalManuscripts,
        connections: totalConnections,
        groups: totalGroups
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' })
  }
}

/**
 * Get analytics data
 */
export const getAnalytics = async (req, res) => {
  try {
    const analytics = {
      userGrowth: [],
      contentActivity: [],
      engagement: {}
    }

    res.json({
      success: true,
      analytics
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' })
  }
}

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    if (role) {
      filter.role = role
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      User.countDocuments(filter)
    ])

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch users' })
  }
}

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params
    const { status } = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
      user,
      message: 'User status updated successfully'
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    res.status(500).json({ success: false, message: 'Failed to update user status' })
  }
}

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { role } = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
      user,
      message: 'User role updated successfully'
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({ success: false, message: 'Failed to update user role' })
  }
}

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ success: false, message: 'Failed to delete user' })
  }
}

/**
 * Revoke role from user (remove editor/instructor/recruiter role)
 */
export const revokeUserRole = async (req, res) => {
  try {
    const { userId } = req.params
    const { roleToRevoke } = req.body

    console.log('🔍 Revoke role request received:')
    console.log('  - User ID:', userId)
    console.log('  - Role to revoke:', roleToRevoke)

    const user = await User.findById(userId)

    if (!user) {
      console.log('❌ User not found:', userId)
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    console.log('✅ User found:', user.name || user.email)
    console.log('  - Current role:', user.role)

    // Check if user actually has this role
    if (user.role !== roleToRevoke) {
      console.log('⚠️ User does not have the role to revoke')
      return res.status(400).json({ 
        success: false, 
        message: `User does not have ${roleToRevoke} role. Current role is ${user.role}` 
      })
    }

    // Revert to regular user role
    user.role = 'user'
    await user.save()

    console.log('✅ Role revoked successfully. New role:', user.role)

    // Send real-time notification via Socket.IO
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(user._id.toString()).emit('role:revoked', {
          oldRole: roleToRevoke,
          newRole: 'user',
          message: `Your ${roleToRevoke} role has been revoked. Your account is now a regular user account.`
        });
        console.log('📡 Real-time revoke notification sent to user');
      }
    } catch (socketError) {
      console.error('⚠️ Socket notification error:', socketError);
      // Don't fail the request if socket notification fails
    }

    // Send email notification to user
    try {
      const emailSubject = `Role Revoked - ${roleToRevoke} Access Removed`
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ef4444;">Role Access Revoked</h2>
          <p>Hello ${user.name || user.email},</p>
          <p>This is to inform you that your <strong>${roleToRevoke}</strong> role has been revoked by the administrator.</p>
          <p>Your account has been changed back to a regular user account.</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Role Change Details:</strong></p>
            <ul style="margin: 10px 0;">
              <li>Previous Role: <strong>${roleToRevoke}</strong></li>
              <li>Current Role: <strong>User</strong></li>
              <li>Changed On: ${new Date().toLocaleDateString()}</li>
            </ul>
          </div>
          <p>If you believe this was done in error or would like to discuss this decision, please contact the administrator.</p>
          <p>Thank you for your understanding.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from Planning Insights.</p>
        </div>
      `
      
      await sendEmail(user.email, emailSubject, emailBody)
      console.log('📧 Email notification sent to user:', user.email)
    } catch (emailError) {
      console.error('⚠️ Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: `${roleToRevoke} role revoked successfully. User role changed to 'user'.`
    })
  } catch (error) {
    console.error('❌ Error revoking user role:', error)
    res.status(500).json({ success: false, message: 'Failed to revoke role' })
  }
}

// ==================== JOB PORTAL MANAGEMENT ====================

export const getAllJobsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (status) {
      filter.status = status
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('postedBy', 'firstName lastName email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Job.countDocuments(filter)
    ])

    res.json({
      success: true,
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' })
  }
}

export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params
    const { status } = req.body

    const job = await Job.findByIdAndUpdate(
      jobId,
      { status },
      { new: true }
    )

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    res.json({
      success: true,
      job,
      message: 'Job status updated successfully'
    })
  } catch (error) {
    console.error('Error updating job status:', error)
    res.status(500).json({ success: false, message: 'Failed to update job status' })
  }
}

export const toggleJobFeatured = async (req, res) => {
  try {
    const { jobId } = req.params
    const { featured } = req.body

    const job = await Job.findByIdAndUpdate(
      jobId,
      { featured },
      { new: true }
    )

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    res.json({
      success: true,
      job,
      message: `Job ${featured ? 'featured' : 'unfeatured'} successfully`
    })
  } catch (error) {
    console.error('Error toggling job featured:', error)
    res.status(500).json({ success: false, message: 'Failed to toggle job featured' })
  }
}

export const deleteJob = async (req, res) => {
  try {
    const { jobId } = req.params

    const job = await Job.findByIdAndDelete(jobId)

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' })
    }

    res.json({
      success: true,
      message: 'Job deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting job:', error)
    res.status(500).json({ success: false, message: 'Failed to delete job' })
  }
}

// ==================== LEARNING CENTER MANAGEMENT ====================

export const getAllCoursesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (status) {
      filter.status = status
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor', 'firstName lastName email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Course.countDocuments(filter)
    ])

    res.json({
      success: true,
      courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch courses' })
  }
}

export const updateCourseStatus = async (req, res) => {
  try {
    const { courseId } = req.params
    const { status } = req.body

    const course = await Course.findByIdAndUpdate(
      courseId,
      { status },
      { new: true }
    )

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    res.json({
      success: true,
      course,
      message: 'Course status updated successfully'
    })
  } catch (error) {
    console.error('Error updating course status:', error)
    res.status(500).json({ success: false, message: 'Failed to update course status' })
  }
}

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findByIdAndDelete(courseId)

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    res.status(500).json({ success: false, message: 'Failed to delete course' })
  }
}

// ==================== NEWSROOM MANAGEMENT ====================

export const getAllArticlesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', approvalStatus = '' } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (status) {
      filter.status = status
    }
    if (approvalStatus) {
      filter.approvalStatus = approvalStatus
    }

    console.log('=== GET ALL ARTICLES ADMIN ===')
    console.log('Query params:', req.query)
    console.log('Filter:', filter)

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .populate('author', 'firstName lastName email profile')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Article.countDocuments(filter)
    ])

    console.log('Articles found:', articles.length)
    console.log('Total count:', total)

    res.json({
      success: true,
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch articles' })
  }
}

export const updateArticleStatus = async (req, res) => {
  try {
    const { articleId } = req.params
    const { status, approvalStatus, reason, modificationNotes } = req.body

    console.log('=== UPDATE ARTICLE STATUS ===')
    console.log('Article ID:', articleId)
    console.log('Update data:', req.body)

    const updateData = {}
    
    // If approvalStatus is being set to 'approved', also set status and isPublished
    if (approvalStatus === 'approved') {
      updateData.status = 'published'
      updateData.approvalStatus = 'approved'
      updateData.isPublished = true
      updateData.publishedAt = new Date()
      updateData.reviewedBy = req.user.userId || req.user.id
      updateData.reviewedAt = new Date()
      console.log('Article being approved - setting to published')
    } else {
      // For other approval statuses, update fields individually
      if (status) updateData.status = status
      if (approvalStatus) updateData.approvalStatus = approvalStatus
    }
    
    if (reason) updateData.rejectionReason = reason
    if (modificationNotes) updateData.modificationNotes = modificationNotes

    const article = await Article.findByIdAndUpdate(
      articleId,
      updateData,
      { new: true }
    ).populate('author', 'firstName lastName email profile')

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    console.log('Article updated successfully:', article._id)
    console.log('Final status:', article.status)
    console.log('Final approvalStatus:', article.approvalStatus)
    console.log('Final isPublished:', article.isPublished)

    res.json({
      success: true,
      article,
      message: 'Article status updated successfully'
    })
  } catch (error) {
    console.error('Error updating article status:', error)
    res.status(500).json({ success: false, message: 'Failed to update article status' })
  }
}

export const deleteArticle = async (req, res) => {
  try {
    const { articleId } = req.params

    const article = await Article.findByIdAndDelete(articleId)

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    res.json({
      success: true,
      message: 'Article deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting article:', error)
    res.status(500).json({ success: false, message: 'Failed to delete article' })
  }
}

// ==================== FORUM MANAGEMENT ====================

export const getAllThreadsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, flagged = '' } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (flagged === 'true') {
      filter.flagged = true
    }

    const [threads, total] = await Promise.all([
      Thread.find(filter)
        .populate('author', 'firstName lastName email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Thread.countDocuments(filter)
    ])

    res.json({
      success: true,
      threads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching threads:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch threads' })
  }
}

export const toggleThreadFlag = async (req, res) => {
  try {
    const { threadId } = req.params
    const { flagged } = req.body

    const thread = await Thread.findByIdAndUpdate(
      threadId,
      { flagged },
      { new: true }
    )

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' })
    }

    res.json({
      success: true,
      thread,
      message: `Thread ${flagged ? 'flagged' : 'unflagged'} successfully`
    })
  } catch (error) {
    console.error('Error toggling thread flag:', error)
    res.status(500).json({ success: false, message: 'Failed to toggle thread flag' })
  }
}

export const deleteThread = async (req, res) => {
  try {
    const { threadId } = req.params

    const thread = await Thread.findByIdAndDelete(threadId)

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' })
    }

    res.json({
      success: true,
      message: 'Thread deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting thread:', error)
    res.status(500).json({ success: false, message: 'Failed to delete thread' })
  }
}

// ==================== PUBLISHING HOUSE MANAGEMENT ====================

export const createPublishingRequirement = async (req, res) => {
  try {
    console.log('📝 Creating publishing requirement')
    console.log('Request body:', req.body)
    console.log('Request user:', req.user)
    
    const requirementData = {
      ...req.body,
      createdBy: req.user?.id || req.user?.userId || req.user?._id
    }
    
    console.log('Requirement data with createdBy:', requirementData)
    
    const requirement = await PublishingRequirement.create(requirementData)
    
    console.log('✅ Requirement created:', requirement)

    res.status(201).json({
      success: true,
      data: {
        requirement
      },
      message: 'Publishing requirement created successfully'
    })
  } catch (error) {
    console.error('❌ Error creating publishing requirement:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create publishing requirement' 
    })
  }
}

export const getAllPublishingRequirements = async (req, res) => {
  try {
    const requirements = await PublishingRequirement.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: {
        requirements
      }
    })
  } catch (error) {
    console.error('Error fetching publishing requirements:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch publishing requirements' })
  }
}

export const updatePublishingRequirement = async (req, res) => {
  try {
    const { requirementId } = req.params

    const requirement = await PublishingRequirement.findByIdAndUpdate(
      requirementId,
      req.body,
      { new: true, runValidators: true }
    )

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Publishing requirement not found' })
    }

    res.json({
      success: true,
      data: {
        requirement
      },
      message: 'Publishing requirement updated successfully'
    })
  } catch (error) {
    console.error('Error updating publishing requirement:', error)
    res.status(500).json({ success: false, message: 'Failed to update publishing requirement' })
  }
}

export const deletePublishingRequirement = async (req, res) => {
  try {
    const { requirementId } = req.params

    const requirement = await PublishingRequirement.findByIdAndDelete(requirementId)

    if (!requirement) {
      return res.status(404).json({ success: false, message: 'Publishing requirement not found' })
    }

    res.json({
      success: true,
      message: 'Publishing requirement deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting publishing requirement:', error)
    res.status(500).json({ success: false, message: 'Failed to delete publishing requirement' })
  }
}

export const getAllManuscriptsOverview = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, field, requirementId } = req.query
    const skip = (page - 1) * limit

    // Build filter query - only fetch manuscripts (not research papers)
    const filter = { type: 'manuscript' }
    if (status) filter.status = status
    if (requirementId) filter.requirementId = requirementId
    
    // Query manuscripts with proper population
    const query = Manuscript.find(filter)
      .populate('requirementId', 'title topic field')
      .populate('author.userId', 'name email')
      .populate('assignedEditor', 'email profile')
      .populate('reviewedBy', 'email profile')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const [manuscripts, total, stats] = await Promise.all([
      query,
      Manuscript.countDocuments(filter),
      Manuscript.aggregate([
        { $match: { type: 'manuscript' } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ])
    ])

    // Calculate stats from aggregation
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    // Filter by field after population if needed
    let filteredManuscripts = manuscripts
    if (field) {
      filteredManuscripts = manuscripts.filter(m => 
        m.requirementId?.field === field
      )
    }

    res.json({
      success: true,
      data: {
        manuscripts: filteredManuscripts,
        stats: {
          total: total,
          pending: statusStats.pending || 0,
          accepted: statusStats.accepted || 0,
          rejected: statusStats.rejected || 0,
          'under-review': statusStats['under-review'] || 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: field ? filteredManuscripts.length : total,
          pages: Math.ceil((field ? filteredManuscripts.length : total) / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching manuscripts:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch manuscripts' })
  }
}

export const getAllResearchPapersOverview = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const skip = (page - 1) * limit

    // Build filter query - only fetch research papers from Manuscript collection
    const filter = { type: 'research-paper' }
    if (status) filter.status = status

    // Query research papers from Manuscript collection
    const query = Manuscript.find(filter)
      .populate('author.userId', 'name email')
      .populate('requirementId', 'title topic field')
      .populate('assignedEditor', 'email profile')
      .populate('reviewedBy', 'email profile')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })

    const [papers, total, stats] = await Promise.all([
      query,
      Manuscript.countDocuments(filter),
      Manuscript.aggregate([
        { $match: { type: 'research-paper' } },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ])
    ])

    // Calculate stats from aggregation
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        papers: papers,
        stats: {
          total: total,
          pending: statusStats.pending || 0,
          accepted: statusStats.accepted || 0,
          rejected: statusStats.rejected || 0,
          'under-review': statusStats['under-review'] || 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching research papers:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch research papers' })
  }
}

export const getManuscriptsByRequirement = async (req, res) => {
  try {
    const { requirementId } = req.params

    const manuscripts = await Manuscript.find({ requirementId: requirementId })
      .populate('requirementId', 'title topic field')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      manuscripts
    })
  } catch (error) {
    console.error('Error fetching manuscripts:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch manuscripts' })
  }
}

export const reviewManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    const { status, reviewComments, adminRemarks } = req.body

    console.log('📝 Reviewing manuscript:', manuscriptId)
    console.log('📝 Review data:', req.body)

    const updateData = {
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    }

    if (status) updateData.status = status
    // Support both reviewComments and adminRemarks field names
    const remarks = reviewComments || adminRemarks
    if (remarks) updateData.adminRemarks = remarks

    const manuscript = await Manuscript.findByIdAndUpdate(
      manuscriptId,
      updateData,
      { new: true }
    )
      .populate('requirementId', 'title topic field')
      .populate('author.userId', 'name email')

    if (!manuscript) {
      console.error('❌ Manuscript not found:', manuscriptId)
      return res.status(404).json({ success: false, message: 'Manuscript not found' })
    }

    console.log('✅ Manuscript updated successfully')
    console.log('   - Type:', manuscript.type)
    console.log('   - Status:', manuscript.status)

    // Send email notification to author
    try {
      const statusMessages = {
        accepted: {
          subject: '🎉 Manuscript Accepted - Planning Insights',
          message: 'Congratulations! Your manuscript has been accepted for publication.',
          color: '#10b981'
        },
        rejected: {
          subject: '❌ Manuscript Status Update - Planning Insights',
          message: 'Thank you for your submission. After careful review, we are unable to accept your manuscript at this time.',
          color: '#ef4444'
        },
        'under-review': {
          subject: '📝 Manuscript Under Review - Planning Insights',
          message: 'Your manuscript is currently under review by our editorial team.',
          color: '#f59e0b'
        },
        pending: {
          subject: '⏳ Manuscript Pending Review - Planning Insights',
          message: 'Your manuscript is pending review by our editorial team.',
          color: '#6366f1'
        }
      }

      const statusInfo = statusMessages[status] || {
        subject: '📄 Manuscript Status Update - Planning Insights',
        message: 'Your manuscript status has been updated.',
        color: '#6366f1'
      }

      // Determine if it's a research paper or manuscript
      const submissionType = manuscript.type === 'research-paper' ? 'Research Paper' : 'Manuscript'
      const submissionIcon = manuscript.type === 'research-paper' ? '📄' : '📝'

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #524393 0%, #BDD337 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
              .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; background: ${statusInfo.color}; color: white; font-weight: bold; margin: 15px 0; }
              .info-box { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${statusInfo.color}; }
              .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #524393; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${submissionIcon} ${submissionType} Review Update</h1>
              </div>
              <div class="content">
                <p>Dear ${manuscript.author.name},</p>
                
                <p>${statusInfo.message}</p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0;">${submissionType} Details</h3>
                  <p><strong>Title:</strong> ${manuscript.title}</p>
                  <p><strong>Type:</strong> ${submissionType}</p>
                  <p><strong>Requirement:</strong> ${manuscript.requirementId?.title || 'N/A'}</p>
                  <p><strong>Topic:</strong> ${manuscript.requirementId?.topic || 'N/A'}</p>
                  <p><strong>Status:</strong> <span class="status-badge">${status.toUpperCase()}</span></p>
                  <p><strong>Reviewed Date:</strong> ${new Date(manuscript.reviewedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                
                ${remarks ? `
                <div class="info-box">
                  <h3 style="margin-top: 0;">Admin Feedback</h3>
                  <p>${remarks}</p>
                </div>
                ` : ''}
                
                <p style="margin-top: 25px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/publishing" class="button">
                    View My Submissions
                  </a>
                </p>
                
                ${status === 'rejected' ? `
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                  We encourage you to consider the feedback provided and resubmit your manuscript after making appropriate revisions.
                </p>
                ` : ''}
                
                <p>If you have any questions, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br><strong>Planning Insights Editorial Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated email from Planning Insights Publishing House.</p>
                <p>© ${new Date().getFullYear()} Planning Insights. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `

      await sendMail({
        to: manuscript.author.email,
        subject: statusInfo.subject,
        html: emailHtml,
        text: `
Manuscript Review Update

Dear ${manuscript.author.name},

${statusInfo.message}

Manuscript Details:
- Title: ${manuscript.title}
- Status: ${status.toUpperCase()}
- Reviewed Date: ${new Date(manuscript.reviewedAt).toLocaleDateString()}

${reviewComments ? `Admin Feedback:\n${reviewComments}\n` : ''}

View your submissions at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/publishing

Best regards,
Planning Insights Editorial Team
        `
      })

      console.log(`✅ Email sent to ${manuscript.author.email} for manuscript ${manuscriptId}`)
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError)
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      manuscript,
      message: 'Manuscript reviewed successfully and author has been notified'
    })
  } catch (error) {
    console.error('Error reviewing manuscript:', error)
    res.status(500).json({ success: false, message: 'Failed to review manuscript' })
  }
}

// ==================== NETWORKING ARENA MANAGEMENT ====================

export const getAllConnectionsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const [connections, total] = await Promise.all([
      Connection.find()
        .populate('user', 'firstName lastName email')
        .populate('connectedUser', 'firstName lastName email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Connection.countDocuments()
    ])

    res.json({
      success: true,
      connections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching connections:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch connections' })
  }
}

export const getAllGroupsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const [groups, total] = await Promise.all([
      Group.find()
        .populate('createdBy', 'firstName lastName email')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Group.countDocuments()
    ])

    res.json({
      success: true,
      groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch groups' })
  }
}

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params

    const group = await Group.findByIdAndDelete(groupId)

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' })
    }

    res.json({
      success: true,
      message: 'Group deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting group:', error)
    res.status(500).json({ success: false, message: 'Failed to delete group' })
  }
}

/**
 * Delete manuscript
 */
export const deleteManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    console.log('🗑️ Attempting to delete manuscript:', manuscriptId)

    const manuscript = await Manuscript.findById(manuscriptId)

    if (!manuscript) {
      console.log('❌ Manuscript not found:', manuscriptId)
      return res.status(404).json({ success: false, message: 'Manuscript not found' })
    }

    console.log('✅ Found manuscript:', manuscript.title)

    // Delete the manuscript
    await Manuscript.findByIdAndDelete(manuscriptId)
    console.log('✅ Manuscript deleted from database')

    // Update the requirement's manuscript count
    if (manuscript.requirementId) {
      await PublishingRequirement.findByIdAndUpdate(
        manuscript.requirementId,
        { $inc: { manuscriptsCount: -1 } }
      )
      console.log('✅ Updated requirement manuscript count')
    }

    res.json({
      success: true,
      message: 'Manuscript deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting manuscript:', error)
    res.status(500).json({ success: false, message: 'Failed to delete manuscript' })
  }
}
// ==================== FORUM MANAGEMENT ====================

/**
 * Get pending forums for approval
 */
export const getPendingForums = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const forums = await Forum.find({ status: 'pending' })
      .populate('creator', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    const total = await Forum.countDocuments({ status: 'pending' })

    // Get first question for each forum if exists
    for (let forum of forums) {
      const firstQuestion = await Question.findOne({ forum: forum._id })
        .select('title content')
        .lean()
      forum.firstQuestion = firstQuestion
    }

    res.json({
      success: true,
      data: {
        forums,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Get pending forums error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch pending forums' })
  }
}

/**
 * Approve a forum
 */
export const approveForum = async (req, res) => {
  try {
    const { forumId } = req.params
    const adminId = req.user.id || req.user.userId

    const forum = await Forum.findById(forumId).populate('creator', 'email profile')
    
    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' })
    }

    if (forum.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Forum is not pending approval' })
    }

    forum.status = 'approved'
    forum.approvedBy = adminId
    forum.approvedAt = new Date()
    await forum.save()

    // Send approval email to creator
    if (forum.creator && forum.creator.email) {
      await sendEmail({
        to: forum.creator.email,
        subject: `Your forum "${forum.title}" has been approved!`,
        html: `
          <h2>Forum Approved</h2>
          <p>Congratulations! Your forum "${forum.title}" has been approved and is now live.</p>
          <p><a href="${process.env.FRONTEND_URL}/forum/${forum.slug}">View Your Forum</a></p>
          <p>Thank you for contributing to our community!</p>
        `
      })
    }

    res.json({
      success: true,
      message: 'Forum approved successfully',
      data: { forum }
    })
  } catch (error) {
    console.error('Approve forum error:', error)
    res.status(500).json({ success: false, message: 'Failed to approve forum' })
  }
}

/**
 * Reject a forum
 */
export const rejectForum = async (req, res) => {
  try {
    const { forumId } = req.params
    const { reason } = req.body
    const adminId = req.user.id || req.user.userId

    const forum = await Forum.findById(forumId).populate('creator', 'email profile')
    
    if (!forum) {
      return res.status(404).json({ success: false, message: 'Forum not found' })
    }

    if (forum.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Forum is not pending approval' })
    }

    forum.status = 'rejected'
    forum.rejectionReason = reason || 'Forum does not meet community guidelines'
    forum.approvedBy = adminId
    forum.approvedAt = new Date()
    await forum.save()

    // Send rejection email to creator
    if (forum.creator && forum.creator.email) {
      await sendEmail({
        to: forum.creator.email,
        subject: `Forum "${forum.title}" - Action Required`,
        html: `
          <h2>Forum Not Approved</h2>
          <p>Unfortunately, your forum "${forum.title}" was not approved.</p>
          <p><strong>Reason:</strong> ${forum.rejectionReason}</p>
          <p>You can review and resubmit your forum with necessary changes.</p>
        `
      })
    }

    res.json({
      success: true,
      message: 'Forum rejected',
      data: { forum }
    })
  } catch (error) {
    console.error('Reject forum error:', error)
    res.status(500).json({ success: false, message: 'Failed to reject forum' })
  }
}

/**
 * Get all forums (admin view)
 */
export const getAllForumsAdmin = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query

    const query = {}
    if (status) query.status = status
    if (category) query.category = category

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const forums = await Forum.find(query)
      .populate('creator', 'email profile')
      .populate('approvedBy', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()

    const total = await Forum.countDocuments(query)

    res.json({
      success: true,
      data: {
        forums,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Get all forums error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch forums' })
  }
}

// ==================== ROLE REQUESTS ====================

/**
 * Get all role upgrade requests
 */
export const getAllRoleRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const skip = (page - 1) * limit

    const filter = {}
    if (status) filter.status = status

    const [requests, total] = await Promise.all([
      RoleRequest.find(filter)
        .populate('userId', 'email profile.firstName profile.lastName profile.avatar')
        .populate('reviewedBy', 'email profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      RoleRequest.countDocuments(filter)
    ])

    // Debug: Log the populated data
    console.log('🔍 Fetched role requests:', requests.length);
    if (requests.length > 0) {
      console.log('📋 First request userId:', requests[0].userId);
      console.log('📧 User email:', requests[0].userId?.email);
      console.log('👤 User profile:', requests[0].userId?.profile);
    }

    // Get stats
    const stats = await RoleRequest.aggregate([
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }}
    ])

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        requests,
        stats: {
          total: total,
          pending: statusStats.pending || 0,
          approved: statusStats.approved || 0,
          rejected: statusStats.rejected || 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching role requests:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch role requests' })
  }
}

/**
 * Review role upgrade request (approve or reject)
 */
export const reviewRoleRequest = async (req, res) => {
  try {
    console.log('📝 Review role request called');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('User from token:', req.user);
    
    const { requestId } = req.params
    const { status, adminNotes } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be approved or rejected' 
      })
    }

    const roleRequest = await RoleRequest.findById(requestId).populate('userId', 'name email')

    if (!roleRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role request not found' 
      })
    }

    if (roleRequest.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'This request has already been reviewed' 
      })
    }

    // Update role request
    roleRequest.status = status
    roleRequest.reviewedBy = req.user.userId || req.user.id
    roleRequest.reviewedAt = new Date()
    if (adminNotes) roleRequest.adminNotes = adminNotes
    await roleRequest.save()

    // If approved, update user's role
    if (status === 'approved') {
      console.log('✅ Approving role request, updating user role...');
      await User.findByIdAndUpdate(roleRequest.userId._id, {
        role: roleRequest.requestedRole
      })
      console.log('✅ User role updated successfully');

      // Send real-time notification via Socket.IO
      try {
        const io = req.app.get('io');
        if (io) {
          io.to(roleRequest.userId._id.toString()).emit('role:approved', {
            newRole: roleRequest.requestedRole,
            message: `Your ${roleRequest.requestedRole} role has been approved!`
          });
          console.log('📡 Real-time notification sent to user');
        }
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
        // Don't fail the request if socket notification fails
      }
    }

    // Send notification email (optional)
    // You can implement email notification here

    console.log('✅ Role request processed successfully');
    res.json({
      success: true,
      message: `Role request ${status} successfully`,
      data: roleRequest
    })
  } catch (error) {
    console.error('❌ Error reviewing role request:', error)
    res.status(500).json({ success: false, message: 'Failed to review role request', error: error.message })
  }
}

/**
 * Delete role request
 */
export const deleteRoleRequest = async (req, res) => {
  try {
    console.log('🗑️ Delete role request called');
    console.log('Request params:', req.params);
    console.log('Request ID:', req.params.requestId);
    console.log('Requested by admin:', req.user?.email);
    
    const { requestId } = req.params

    // Validate requestId format
    if (!requestId || !requestId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ Invalid request ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid request ID format'
      })
    }

    const roleRequest = await RoleRequest.findById(requestId).populate('userId', 'role email profile')
    console.log('Found role request:', roleRequest ? {
      id: roleRequest._id,
      status: roleRequest.status,
      requestedRole: roleRequest.requestedRole,
      userId: roleRequest.userId?._id,
      userCurrentRole: roleRequest.userId?.role
    } : 'NOT FOUND');
    
    if (!roleRequest) {
      console.log('❌ Role request not found');
      return res.status(404).json({
        success: false,
        message: 'Role request not found'
      })
    }

    // Check if this is an approved request and user still has the role
    if (roleRequest.status === 'approved' && roleRequest.userId) {
      const userStillHasRole = roleRequest.userId.role === roleRequest.requestedRole;
      
      if (userStillHasRole) {
        console.log('❌ Cannot delete - user still has active role');
        return res.status(400).json({
          success: false,
          message: `Cannot delete this request. The user still has the ${roleRequest.requestedRole} role active. Please revoke the role first before deleting the request.`
        })
      }
    }

    // Delete the role request
    await RoleRequest.findByIdAndDelete(requestId)
    console.log('✅ Role request deleted successfully');
    console.log('Deleted request details:', {
      id: requestId,
      status: roleRequest.status,
      requestedRole: roleRequest.requestedRole
    });

    res.json({
      success: true,
      message: 'Role request deleted successfully',
      data: {
        deletedId: requestId,
        status: roleRequest.status
      }
    })
  } catch (error) {
    console.error('❌ Error deleting role request:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role request',
      error: error.message
    })
  }
}
