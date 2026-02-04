import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import User from '../../models/User.js'
import Article from '../../models/Article.js'
import Job from '../../models/Job.js'
import Course from '../../models/Course.js'
import ForumThread from '../../models/ForumThread.js'
import Connection from '../../models/Connection.js'

const router = express.Router()

/**
 * Get user dashboard statistics
 * GET /api/user/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id

    // Fetch stats in parallel for better performance
    const [articles, applications, courses, forumPosts, connections, user] = await Promise.all([
      Article.countDocuments({ author: userId }),
      Job.countDocuments({ 'applications.applicant': userId }),
      Course.countDocuments({ 'enrollments.student': userId }),
      ForumThread.countDocuments({ createdBy: userId }),
      Connection.countDocuments({ 
        $or: [
          { requester: userId, status: 'accepted' },
          { recipient: userId, status: 'accepted' }
        ]
      }),
      User.findById(userId).select('points')
    ])

    // Get recent activity
    const recentArticles = await Article.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status createdAt approvalStatus')

    const recentActivity = recentArticles.map(article => ({
      type: 'article',
      title: `Article "${article.title}" - ${article.approvalStatus}`,
      date: article.createdAt.toISOString(),
      status: article.status === 'published' ? 'success' : article.approvalStatus === 'pending' ? 'pending' : 'info'
    }))

    // Add welcome message if no activity
    if (recentActivity.length === 0) {
      recentActivity.push({
        type: 'info',
        title: 'Welcome to Planning Insights!',
        date: new Date().toISOString(),
        status: 'info'
      })
    }

    const stats = {
      articles,
      applications,
      courses,
      forumPosts,
      connections,
      points: user?.points || 0
    }

    console.log('📊 Stats fetched for user:', userId, stats)

    res.json({
      success: true,
      stats,
      recentActivity
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    })
  }
})

/**
 * Update user points
 * POST /api/user/points
 */
router.post('/points', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const { points, action } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.points = (user.points || 0) + points
    await user.save()

    // Emit real-time update via Socket.IO
    const io = req.app.get('io')
    if (io) {
      io.to(`user:${userId}`).emit('stats:updated', {
        points: user.points
      })
    }

    console.log(`✅ User ${userId} points updated: ${action} (+${points})`)

    res.json({
      success: true,
      points: user.points,
      message: `${action} successful! +${points} points`
    })
  } catch (error) {
    console.error('Error updating user points:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update points'
    })
  }
})

/**
 * Get user activity feed
 * GET /api/user/activity
 */
router.get('/activity', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id
    const limit = parseInt(req.query.limit) || 20

    // Fetch various activities
    const [articles, forumThreads] = await Promise.all([
      Article.find({ author: userId })
        .sort({ createdAt: -1 })
        .limit(limit / 2)
        .select('title status createdAt approvalStatus'),
      ForumThread.find({ createdBy: userId })
        .sort({ createdAt: -1 })
        .limit(limit / 2)
        .select('title createdAt')
    ])

    const activities = [
      ...articles.map(article => ({
        type: 'article',
        title: `Published article: "${article.title}"`,
        date: article.createdAt.toISOString(),
        status: article.status === 'published' ? 'success' : 'pending',
        icon: 'FileText'
      })),
      ...forumThreads.map(thread => ({
        type: 'forum',
        title: `Created forum thread: "${thread.title}"`,
        date: thread.createdAt.toISOString(),
        status: 'info',
        icon: 'MessageSquare'
      }))
    ]

    // Sort by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({
      success: true,
      activities: activities.slice(0, limit)
    })
  } catch (error) {
    console.error('Error fetching user activity:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity'
    })
  }
})

export default router
