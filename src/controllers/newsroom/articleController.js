import Article from '../../models/Article.js'
import User from '../../models/User.js'

/**
 * Create new article
 */
export const createArticle = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      category,
      tags,
      isPublished,
      plagiarismScore,
      plagiarismReport,
      allowComments,
      coAuthors
    } = req.body

    console.log('=== ARTICLE SUBMISSION RECEIVED ===')
    console.log('Title:', title)
    console.log('Category:', category)
    console.log('isPublished:', isPublished)
    console.log('User:', req.user)
    console.log('File:', req.file)

    // Parse JSON strings if they come from FormData
    const parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags
    const parsedCoAuthors = typeof coAuthors === 'string' ? JSON.parse(coAuthors) : coAuthors
    const parsedPlagiarismReport = typeof plagiarismReport === 'string' ? JSON.parse(plagiarismReport) : plagiarismReport

    // Transform coAuthors to match Article model schema
    const transformedCoAuthors = (parsedCoAuthors || []).map(coAuthor => ({
      user: coAuthor.userId || coAuthor.user,
      email: coAuthor.email,
      status: coAuthor.status || 'pending'
    }))

    // Determine status based on submission type
    let status = 'draft'
    let approvalStatus = 'pending'

    if (isPublished === 'true' || isPublished === true) {
      status = 'pending' // Pending admin approval
      approvalStatus = 'pending'
    }

    // For drafts, provide default values if fields are empty
    const articleData = {
      title: title || 'Untitled Draft',
      excerpt: excerpt || 'No excerpt provided',
      content: content || '<p>No content yet</p>',
      author: req.user.id || req.user.userId,
      category: category || 'Urban Planning',
      tags: parsedTags || [],
      status,
      approvalStatus,
      isPublished: false, // Only published after admin approval
      plagiarismScore: plagiarismScore || 0,
      plagiarismReport: parsedPlagiarismReport || null,
      allowComments: allowComments !== 'false',
      coAuthors: transformedCoAuthors,
      featuredImage: req.file ? req.file.path : null
    }

    const article = await Article.create(articleData)
    await article.populate('author', 'email profile')

    // Emit real-time stats update
    const io = require('../../config/socket.js').getIO()
    if (io) {
      io.to(`user:${article.author._id}`).emit('stats:updated', {
        articles: await Article.countDocuments({ author: article.author._id })
      })
      io.to(`user:${article.author._id}`).emit('activity:new', {
        type: 'article',
        title: `Article "${article.title}" submitted for review`,
        date: new Date().toISOString(),
        status: 'pending'
      })
    }

    console.log('=== ARTICLE CREATED SUCCESSFULLY ===')
    console.log('Article ID:', article._id)
    console.log('Status:', article.status)
    console.log('Approval Status:', article.approvalStatus)
    console.log('Author:', article.author._id)

    res.status(201).json({
      success: true,
      message: 'Article submitted successfully! Awaiting admin approval.',
      data: { article }
    })
  } catch (error) {
    console.error('Create article error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create article'
    })
  }
}

/**
 * Get all articles with filtering
 */
export const getArticles = async (req, res) => {
  try {
    const {
      status,
      approvalStatus,
      category,
      author,
      page = 1,
      limit = 10
    } = req.query

    const query = {}

    if (status) query.status = status
    if (approvalStatus) query.approvalStatus = approvalStatus
    if (category) query.category = category
    if (author) query.author = author

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const articles = await Article.find(query)
      .populate('author', 'email profile')
      .populate('reviewedBy', 'email profile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Article.countDocuments(query)

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Get articles error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch articles'
    })
  }
}

/**
 * Get article by ID
 */
export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findById(id)
      .populate('author', 'email profile')
      .populate('coAuthors', 'email profile')
      .populate('reviewedBy', 'email profile')

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      })
    }

    // Increment views
    article.views += 1
    await article.save()

    res.json({
      success: true,
      data: { article }
    })
  } catch (error) {
    console.error('Get article error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch article'
    })
  }
}

/**
 * Update article
 */
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const article = await Article.findById(id)

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      })
    }

    // Check if user is author or admin
    const userId = req.user.id || req.user.userId
    if (article.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this article'
      })
    }

    // Parse JSON strings from FormData
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags)
    }
    if (updateData.coAuthors && typeof updateData.coAuthors === 'string') {
      updateData.coAuthors = JSON.parse(updateData.coAuthors)
    }
    if (updateData.plagiarismReport && typeof updateData.plagiarismReport === 'string') {
      updateData.plagiarismReport = JSON.parse(updateData.plagiarismReport)
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        article[key] = updateData[key]
      }
    })

    // If user is resubmitting after modification request, reset approval status
    if (article.approvalStatus === 'needsModification') {
      article.approvalStatus = 'pending'
      article.status = 'pending'
      article.isPublished = false
      article.modificationNotes = undefined
    }

    await article.save()
    await article.populate('author', 'email profile')

    res.json({
      success: true,
      message: 'Article updated successfully and resubmitted for review',
      data: { article }
    })
  } catch (error) {
    console.error('Update article error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update article'
    })
  }
}


/**
 * Delete article
 */
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findById(id)

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      })
    }

    // Check if user is author or admin
    const userId = req.user.id || req.user.userId
    if (article.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this article'
      })
    }

    await article.deleteOne()

    res.json({
      success: true,
      message: 'Article deleted successfully'
    })
  } catch (error) {
    console.error('Delete article error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete article'
    })
  }
}

/**
 * Approve article (Admin only)
 */
export const approveArticle = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findById(id)

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      })
    }

    article.status = 'published'
    article.approvalStatus = 'approved'
    article.isPublished = true
    article.publishedAt = new Date()
    article.reviewedBy = req.user.id || req.user.userId
    article.reviewedAt = new Date()

    await article.save()
    await article.populate('author', 'email profile')

    res.json({
      success: true,
      message: 'Article approved and published successfully',
      data: { article }
    })
  } catch (error) {
    console.error('Approve article error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve article'
    })
  }
}

/**
 * Reject article (Admin only)
 */
export const rejectArticle = async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const article = await Article.findById(id)

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      })
    }

    article.status = 'draft'
    article.approvalStatus = 'rejected'
    article.isPublished = false
    article.rejectionReason = reason || 'Article did not meet publication standards'
    article.reviewedBy = req.user.id || req.user.userId
    article.reviewedAt = new Date()

    await article.save()
    await article.populate('author', 'email profile')

    res.json({
      success: true,
      message: 'Article rejected',
      data: { article }
    })
  } catch (error) {
    console.error('Reject article error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject article'
    })
  }
}

/**
 * Get articles pending approval (Admin only)
 */
export const getPendingArticles = async (req, res) => {
  try {
    const articles = await Article.find({ approvalStatus: 'pending' })
      .populate('author', 'email profile')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: {
        articles,
        count: articles.length
      }
    })
  } catch (error) {
    console.error('Get pending articles error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch pending articles'
    })
  }
}

/**
 * Get published articles (Public)
 */
export const getPublishedArticles = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query

    const query = {
      status: 'published',
      approvalStatus: 'approved',
      isPublished: true
    }

    if (category) query.category = category

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const articles = await Article.find(query)
      .populate('author', 'email profile')
      .sort({ publishedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Article.countDocuments(query)

    res.json({
      success: true,
      data: {
        articles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Get published articles error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch published articles'
    })
  }
}

/**
 * Get user's articles
 */
export const getUserArticles = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId

    const articles = await Article.find({ author: userId })
      .populate('reviewedBy', 'email profile')
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: {
        articles,
        count: articles.length
      }
    })
  } catch (error) {
    console.error('Get user articles error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch user articles'
    })
  }
}

/**
 * Like an article
 */
export const likeArticle = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id || req.user.userId

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    // Remove from dislikes if exists
    article.dislikes = article.dislikes.filter(u => u.toString() !== userId)
    
    // Toggle like
    const likeIndex = article.likes.findIndex(u => u.toString() === userId)
    if (likeIndex > -1) {
      article.likes.splice(likeIndex, 1)
    } else {
      article.likes.push(userId)
    }

    article.likesCount = article.likes.length
    article.dislikesCount = article.dislikes.length
    await article.save()

    res.json({
      success: true,
      data: {
        likesCount: article.likesCount,
        dislikesCount: article.dislikesCount,
        userLiked: article.likes.some(u => u.toString() === userId),
        userDisliked: article.dislikes.some(u => u.toString() === userId)
      }
    })
  } catch (error) {
    console.error('Like article error:', error)
    res.status(500).json({ success: false, message: 'Failed to like article' })
  }
}

/**
 * Dislike an article
 */
export const dislikeArticle = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id || req.user.userId

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    // Remove from likes if exists
    article.likes = article.likes.filter(u => u.toString() !== userId)
    
    // Toggle dislike
    const dislikeIndex = article.dislikes.findIndex(u => u.toString() === userId)
    if (dislikeIndex > -1) {
      article.dislikes.splice(dislikeIndex, 1)
    } else {
      article.dislikes.push(userId)
    }

    article.likesCount = article.likes.length
    article.dislikesCount = article.dislikes.length
    await article.save()

    res.json({
      success: true,
      data: {
        likesCount: article.likesCount,
        dislikesCount: article.dislikesCount,
        userLiked: article.likes.some(u => u.toString() === userId),
        userDisliked: article.dislikes.some(u => u.toString() === userId)
      }
    })
  } catch (error) {
    console.error('Dislike article error:', error)
    res.status(500).json({ success: false, message: 'Failed to dislike article' })
  }
}

/**
 * Add comment to article
 */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params
    const { content } = req.body
    const userId = req.user.id || req.user.userId

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment content is required' })
    }

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    if (!article.allowComments) {
      return res.status(403).json({ success: false, message: 'Comments are disabled for this article' })
    }

    const comment = {
      user: userId,
      content,
      createdAt: new Date(),
      likes: []
    }

    article.comments.push(comment)
    await article.save()
    await article.populate('comments.user', 'profile email')

    res.status(201).json({
      success: true,
      data: { comment: article.comments[article.comments.length - 1] }
    })
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ success: false, message: 'Failed to add comment' })
  }
}

/**
 * Delete comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params
    const userId = req.user.id || req.user.userId

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    const comment = article.comments.id(commentId)
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' })
    }

    // Check if user is comment author or article author or admin
    if (comment.user.toString() !== userId && article.author.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' })
    }

    article.comments = article.comments.filter(c => c._id.toString() !== commentId)
    await article.save()

    res.json({ success: true, message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete comment' })
  }
}

/**
 * Flag article for review
 */
export const flagArticle = async (req, res) => {
  try {
    const { id } = req.params
    const { reason, description } = req.body
    const userId = req.user.id || req.user.userId

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Flag reason is required' })
    }

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    // Check if user already flagged this article
    const existingFlag = article.flags.find(f => f.user.toString() === userId && f.status === 'pending')
    if (existingFlag) {
      return res.status(400).json({ success: false, message: 'You have already flagged this article' })
    }

    const flag = {
      user: userId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date()
    }

    article.flags.push(flag)
    await article.save()

    res.status(201).json({
      success: true,
      message: 'Article flagged for review. Thank you for helping us maintain quality content.',
      data: { flag }
    })
  } catch (error) {
    console.error('Flag article error:', error)
    res.status(500).json({ success: false, message: 'Failed to flag article' })
  }
}

/**
 * Increment share count
 */
export const incrementShareCount = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findByIdAndUpdate(
      id,
      { $inc: { shareCount: 1 } },
      { new: true }
    )

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    res.json({
      success: true,
      data: { shareCount: article.shareCount }
    })
  } catch (error) {
    console.error('Increment share count error:', error)
    res.status(500).json({ success: false, message: 'Failed to update share count' })
  }
}

/**
 * Get article statistics
 */
export const getArticleStats = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findById(id)
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' })
    }

    res.json({
      success: true,
      data: {
        views: article.views,
        likesCount: article.likesCount,
        dislikesCount: article.dislikesCount,
        commentsCount: article.comments.length,
        shareCount: article.shareCount,
        flagsCount: article.flags.filter(f => f.status === 'pending').length
      }
    })
  } catch (error) {
    console.error('Get article stats error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch article statistics' })
  }
}
