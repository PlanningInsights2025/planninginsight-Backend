import Manuscript from '../../models/Manuscript.js'
import PublishingRequirement from '../../models/PublishingRequirement.js'

/**
 * Get all manuscripts for editor review
 * Regular editors see only assigned manuscripts
 * Chief editors see all manuscripts
 */
export const getAllManuscriptsForEditor = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query
    const skip = (page - 1) * limit

    // Build filter query - only fetch manuscripts (not research papers)
    const filter = { type: 'manuscript' }
    if (status) filter.status = status
    
    // Regular editors can only see manuscripts assigned to them
    // Chief editors and admins can see all manuscripts
    if (req.user.role === 'editor') {
      filter.assignedEditor = req.user._id
    }

    // Query manuscripts with proper population
    const query = Manuscript.find(filter)
      .populate('author.userId', 'name email profile')
      .populate('requirementId', 'title topic field')
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

    // Apply search filter if provided (frontend filter for now)
    let filteredManuscripts = manuscripts
    if (search) {
      filteredManuscripts = manuscripts.filter(m => 
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.author?.name?.toLowerCase().includes(search.toLowerCase())
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
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching manuscripts for editor:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch manuscripts' })
  }
}

/**
 * Get all research papers for editor review
 * Regular editors see only assigned papers
 * Chief editors see all papers
 */
export const getAllResearchPapersForEditor = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const skip = (page - 1) * limit

    // Build filter query - only fetch research papers from Manuscript collection
    const filter = { type: 'research-paper' }
    if (status) filter.status = status
    
    // Regular editors can only see papers assigned to them
    // Chief editors and admins can see all papers
    if (req.user.role === 'editor') {
      filter.assignedEditor = req.user._id
    }

    // Query research papers from Manuscript collection
    const query = Manuscript.find(filter)
      .populate('author.userId', 'name email profile')
      .populate('requirementId', 'title topic field')
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
    console.error('Error fetching research papers for editor:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch research papers' })
  }
}

/**
 * Get single manuscript/research paper details
 */
export const getManuscriptById = async (req, res) => {
  try {
    const { manuscriptId } = req.params

    const manuscript = await Manuscript.findById(manuscriptId)
      .populate('author.userId', 'name email profile')
      .populate('requirementId', 'title topic field')

    if (!manuscript) {
      return res.status(404).json({ success: false, message: 'Manuscript not found' })
    }

    res.json({
      success: true,
      data: manuscript
    })
  } catch (error) {
    console.error('Error fetching manuscript:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch manuscript' })
  }
}

/**
 * Review/update manuscript or research paper status
 * Regular editors can only review submissions assigned to them
 * Chief editors can review any submission
 */
export const reviewManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    const { status, reviewComments, editorRemarks } = req.body

    console.log('📝 Editor reviewing manuscript:', manuscriptId)
    console.log('📝 Review data:', req.body)

    // First check if manuscript exists
    const existingManuscript = await Manuscript.findById(manuscriptId)
    
    if (!existingManuscript) {
      console.error('❌ Manuscript not found:', manuscriptId)
      return res.status(404).json({ success: false, message: 'Manuscript not found' })
    }
    
    // Regular editors can only review submissions assigned to them
    if (req.user.role === 'editor') {
      if (!existingManuscript.assignedEditor || existingManuscript.assignedEditor.toString() !== req.user._id.toString()) {
        console.error('❌ Access denied: Manuscript not assigned to this editor')
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. You can only review submissions assigned to you.' 
        })
      }
    }

    const updateData = {
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    }

    if (status) updateData.status = status
    
    // Support both reviewComments and editorRemarks field names
    const remarks = reviewComments || editorRemarks
    if (remarks) updateData.adminRemarks = remarks

    const manuscript = await Manuscript.findByIdAndUpdate(
      manuscriptId,
      updateData,
      { new: true }
    )
      .populate('requirementId', 'title topic field')
      .populate('author.userId', 'name email profile')

    if (!manuscript) {
      console.error('❌ Manuscript not found:', manuscriptId)
      return res.status(404).json({ success: false, message: 'Manuscript not found' })
    }

    console.log('✅ Manuscript updated successfully by editor')
    console.log('   - Type:', manuscript.type)
    console.log('   - Status:', manuscript.status)

    res.json({
      success: true,
      message: `${manuscript.type === 'research-paper' ? 'Research paper' : 'Manuscript'} reviewed successfully`,
      data: manuscript
    })
  } catch (error) {
    console.error('Error reviewing manuscript:', error)
    res.status(500).json({ success: false, message: 'Failed to review manuscript' })
  }
}

/**
 * Get editor dashboard statistics
 * Regular editors see stats for only their assigned submissions
 * Chief editors see stats for all submissions
 */
export const getEditorDashboardStats = async (req, res) => {
  try {
    // Build match filter based on role
    const manuscriptMatch = { type: 'manuscript' }
    const paperMatch = { type: 'research-paper' }
    
    // Regular editors only see their assigned submissions
    if (req.user.role === 'editor') {
      manuscriptMatch.assignedEditor = req.user._id
      paperMatch.assignedEditor = req.user._id
    }
    
    const [manuscriptStats, researchPaperStats] = await Promise.all([
      // Manuscript stats
      Manuscript.aggregate([
        { $match: manuscriptMatch },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]),
      // Research paper stats
      Manuscript.aggregate([
        { $match: paperMatch },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ])
    ])

    const manuscriptStatusCounts = manuscriptStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    const researchPaperStatusCounts = researchPaperStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count
      return acc
    }, {})

    res.json({
      success: true,
      data: {
        manuscripts: {
          total: Object.values(manuscriptStatusCounts).reduce((a, b) => a + b, 0),
          pending: manuscriptStatusCounts.pending || 0,
          'under-review': manuscriptStatusCounts['under-review'] || 0,
          accepted: manuscriptStatusCounts.accepted || 0,
          rejected: manuscriptStatusCounts.rejected || 0
        },
        researchPapers: {
          total: Object.values(researchPaperStatusCounts).reduce((a, b) => a + b, 0),
          pending: researchPaperStatusCounts.pending || 0,
          'under-review': researchPaperStatusCounts['under-review'] || 0,
          accepted: researchPaperStatusCounts.accepted || 0,
          rejected: researchPaperStatusCounts.rejected || 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching editor dashboard stats:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' })
  }
}

// ==================== ASSIGNMENT-BASED EDITOR FUNCTIONS ====================

import ResearchPaper from '../../models/ResearchPaper.js'

/**
 * Get all manuscripts assigned to this editor
 * GET /api/editor/my-assignments/manuscripts
 */
export const getMyAssignedManuscripts = async (req, res) => {
  try {
    const editorId = req.user._id
    const { status, page = 1, limit = 20 } = req.query
    
    const filter = { assignedEditor: editorId }
    if (status) {
      filter.status = status
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const manuscripts = await Manuscript.find(filter)
      .populate('author.userId', 'email profile')
      .populate('assignedBy', 'email profile')
      .populate('requirementId')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
    
    const total = await Manuscript.countDocuments(filter)
    
    res.json({
      success: true,
      data: {
        manuscripts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching assigned manuscripts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned manuscripts',
      error: error.message
    })
  }
}

/**
 * Get all research papers assigned to this editor
 * GET /api/editor/my-assignments/papers
 */
export const getMyAssignedResearchPapers = async (req, res) => {
  try {
    const editorId = req.user._id
    const { status, page = 1, limit = 20 } = req.query
    
    const filter = { assignedEditor: editorId }
    if (status) {
      filter.status = status
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const papers = await ResearchPaper.find(filter)
      .populate('userId', 'email profile')
      .populate('assignedBy', 'email profile')
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
    
    const total = await ResearchPaper.countDocuments(filter)
    
    res.json({
      success: true,
      data: {
        papers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('Error fetching assigned research papers:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned research papers',
      error: error.message
    })
  }
}

/**
 * Get single manuscript details for review
 * GET /api/editor/my-assignments/manuscript/:manuscriptId
 */
export const getAssignedManuscriptDetails = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    const editorId = req.user._id
    
    const manuscript = await Manuscript.findOne({
      _id: manuscriptId,
      assignedEditor: editorId
    })
      .populate('author.userId', 'email profile')
      .populate('assignedBy', 'email profile')
      .populate('requirementId')
    
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found or not assigned to you'
      })
    }
    
    res.json({
      success: true,
      data: manuscript
    })
  } catch (error) {
    console.error('Error fetching manuscript details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch manuscript details',
      error: error.message
    })
  }
}

/**
 * Get single research paper details for review
 * GET /api/editor/my-assignments/paper/:paperId
 */
export const getAssignedResearchPaperDetails = async (req, res) => {
  try {
    const { paperId } = req.params
    const editorId = req.user._id
    
    const paper = await ResearchPaper.findOne({
      _id: paperId,
      assignedEditor: editorId
    })
      .populate('userId', 'email profile')
      .populate('assignedBy', 'email profile')
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found or not assigned to you'
      })
    }
    
    res.json({
      success: true,
      data: paper
    })
  } catch (error) {
    console.error('Error fetching research paper details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research paper details',
      error: error.message
    })
  }
}

/**
 * Submit review for assigned manuscript
 * POST /api/editor/my-assignments/review-manuscript/:manuscriptId
 */
export const reviewAssignedManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    const { status, editorRemarks } = req.body
    const editorId = req.user._id
    
    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "accepted" or "rejected"'
      })
    }
    
    // Find manuscript assigned to this editor
    const manuscript = await Manuscript.findOne({
      _id: manuscriptId,
      assignedEditor: editorId
    })
    
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found or not assigned to you'
      })
    }
    
    // Update manuscript with review
    manuscript.status = status
    manuscript.editorRemarks = editorRemarks || ''
    manuscript.editorReviewedAt = new Date()
    manuscript.reviewedBy = editorId
    manuscript.reviewedAt = new Date()
    
    await manuscript.save()
    
    res.json({
      success: true,
      message: `Manuscript ${status} successfully`,
      data: manuscript
    })
  } catch (error) {
    console.error('Error reviewing manuscript:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to review manuscript',
      error: error.message
    })
  }
}

/**
 * Submit review for assigned research paper
 * POST /api/editor/my-assignments/review-paper/:paperId
 */
export const reviewAssignedResearchPaper = async (req, res) => {
  try {
    const { paperId } = req.params
    const { status, editorRemarks } = req.body
    const editorId = req.user._id
    
    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "accepted" or "rejected"'
      })
    }
    
    // Find paper assigned to this editor
    const paper = await ResearchPaper.findOne({
      _id: paperId,
      assignedEditor: editorId
    })
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found or not assigned to you'
      })
    }
    
    // Update paper with review
    paper.status = status
    paper.editorRemarks = editorRemarks || ''
    paper.editorReviewedAt = new Date()
    
    await paper.save()
    
    res.json({
      success: true,
      message: `Research paper ${status} successfully`,
      data: paper
    })
  } catch (error) {
    console.error('Error reviewing research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to review research paper',
      error: error.message
    })
  }
}

/**
 * Get editor workload/assignment statistics
 * GET /api/editor/my-assignments/stats
 */
export const getMyAssignmentStats = async (req, res) => {
  try {
    const editorId = req.user._id
    
    const [
      totalManuscripts,
      pendingManuscripts,
      reviewedManuscripts,
      totalPapers,
      pendingPapers,
      reviewedPapers
    ] = await Promise.all([
      Manuscript.countDocuments({ assignedEditor: editorId }),
      Manuscript.countDocuments({ 
        assignedEditor: editorId, 
        status: 'under-review' 
      }),
      Manuscript.countDocuments({ 
        assignedEditor: editorId, 
        editorReviewedAt: { $ne: null } 
      }),
      ResearchPaper.countDocuments({ assignedEditor: editorId }),
      ResearchPaper.countDocuments({ 
        assignedEditor: editorId, 
        status: { $in: ['pending', 'under-review'] }
      }),
      ResearchPaper.countDocuments({ 
        assignedEditor: editorId, 
        editorReviewedAt: { $ne: null } 
      })
    ])
    
    res.json({
      success: true,
      data: {
        manuscripts: {
          total: totalManuscripts,
          pending: pendingManuscripts,
          reviewed: reviewedManuscripts
        },
        papers: {
          total: totalPapers,
          pending: pendingPapers,
          reviewed: reviewedPapers
        },
        totalAssigned: totalManuscripts + totalPapers,
        totalPending: pendingManuscripts + pendingPapers,
        totalReviewed: reviewedManuscripts + reviewedPapers
      }
    })
  } catch (error) {
    console.error('Error fetching editor stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    })
  }
}

/**
 * Update manuscript remarks (for adding comments during review)
 * PATCH /api/editor/my-assignments/manuscript/:manuscriptId/remarks
 */
export const updateAssignedManuscriptRemarks = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    const { editorRemarks } = req.body
    const editorId = req.user._id
    
    const manuscript = await Manuscript.findOneAndUpdate(
      {
        _id: manuscriptId,
        assignedEditor: editorId
      },
      {
        editorRemarks: editorRemarks || ''
      },
      { new: true }
    )
    
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found or not assigned to you'
      })
    }
    
    res.json({
      success: true,
      message: 'Remarks updated successfully',
      data: manuscript
    })
  } catch (error) {
    console.error('Error updating manuscript remarks:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update remarks',
      error: error.message
    })
  }
}

/**
 * Update research paper remarks
 * PATCH /api/editor/my-assignments/paper/:paperId/remarks
 */
export const updateAssignedResearchPaperRemarks = async (req, res) => {
  try {
    const { paperId } = req.params
    const { editorRemarks } = req.body
    const editorId = req.user._id
    
    const paper = await ResearchPaper.findOneAndUpdate(
      {
        _id: paperId,
        assignedEditor: editorId
      },
      {
        editorRemarks: editorRemarks || ''
      },
      { new: true }
    )
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found or not assigned to you'
      })
    }
    
    res.json({
      success: true,
      message: 'Remarks updated successfully',
      data: paper
    })
  } catch (error) {
    console.error('Error updating research paper remarks:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update remarks',
      error: error.message
    })
  }
}
