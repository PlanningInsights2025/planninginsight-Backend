import Manuscript from '../../models/Manuscript.js'
import ResearchPaper from '../../models/ResearchPaper.js'
import User from '../../models/User.js'

/**
 * Get all manuscripts and research papers
 * GET /api/chief-editor/all-submissions
 */
export const getAllSubmissions = async (req, res) => {
  try {
    const { status, assignedEditor, type, page = 1, limit = 20 } = req.query
    
    // Build filter
    const manuscriptFilter = {}
    const paperFilter = {}
    
    if (status) {
      manuscriptFilter.status = status
      paperFilter.status = status
    }
    
    if (assignedEditor === 'unassigned') {
      manuscriptFilter.assignedEditor = null
      paperFilter.assignedEditor = null
    } else if (assignedEditor === 'assigned') {
      manuscriptFilter.assignedEditor = { $ne: null }
      paperFilter.assignedEditor = { $ne: null }
    } else if (assignedEditor) {
      manuscriptFilter.assignedEditor = assignedEditor
      paperFilter.assignedEditor = assignedEditor
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    let manuscripts = []
    let researchPapers = []
    
    // Fetch based on type filter
    if (!type || type === 'manuscript') {
      manuscripts = await Manuscript.find(manuscriptFilter)
        .populate('author.userId', 'email profile')
        .populate('assignedEditor', 'email profile')
        .populate('assignedBy', 'email profile')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    }
    
    if (!type || type === 'research-paper') {
      paperFilter.status = { $in: ['completed', 'pending', 'under-review', 'accepted', 'rejected'] }
      researchPapers = await ResearchPaper.find(paperFilter)
        .populate('userId', 'email profile')
        .populate('assignedEditor', 'email profile')
        .populate('assignedBy', 'email profile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    }
    
    // Get counts
    const manuscriptCount = await Manuscript.countDocuments(manuscriptFilter)
    const paperCount = await ResearchPaper.countDocuments(paperFilter)
    
    res.json({
      success: true,
      data: {
        manuscripts,
        researchPapers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalManuscripts: manuscriptCount,
          totalPapers: paperCount,
          total: manuscriptCount + paperCount
        }
      }
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message
    })
  }
}

/**
 * Get all editors and their workload
 * GET /api/chief-editor/editors
 */
export const getAllEditors = async (req, res) => {
  try {
    const editors = await User.find({ role: 'editor' })
      .select('email profile')
      .lean()
    
    // Get workload for each editor
    const editorsWithWorkload = await Promise.all(
      editors.map(async (editor) => {
        const manuscriptCount = await Manuscript.countDocuments({
          assignedEditor: editor._id,
          status: { $in: ['pending', 'under-review'] }
        })
        
        const paperCount = await ResearchPaper.countDocuments({
          assignedEditor: editor._id,
          status: { $in: ['pending', 'under-review'] }
        })
        
        return {
          ...editor,
          workload: {
            manuscripts: manuscriptCount,
            papers: paperCount,
            total: manuscriptCount + paperCount
          }
        }
      })
    )
    
    res.json({
      success: true,
      data: editorsWithWorkload
    })
  } catch (error) {
    console.error('Error fetching editors:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch editors',
      error: error.message
    })
  }
}

/**
 * Auto-assign unassigned manuscripts and papers to editors
 * POST /api/chief-editor/auto-assign
 */
export const autoAssignSubmissions = async (req, res) => {
  try {
    const chiefEditorId = req.user._id
    
    // Get all editors
    const editors = await User.find({ role: 'editor' }).select('_id email profile').lean()
    
    if (editors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No editors available for assignment'
      })
    }
    
    // Get unassigned manuscripts
    const unassignedManuscripts = await Manuscript.find({
      assignedEditor: null,
      status: { $in: ['pending', 'under-review'] }
    })
    
    // Get unassigned research papers (completed but not yet reviewed)
    const unassignedPapers = await ResearchPaper.find({
      assignedEditor: null,
      status: 'completed'
    })
    
    const allUnassigned = [
      ...unassignedManuscripts.map(m => ({ id: m._id, type: 'manuscript', model: Manuscript })),
      ...unassignedPapers.map(p => ({ id: p._id, type: 'paper', model: ResearchPaper }))
    ]
    
    if (allUnassigned.length === 0) {
      return res.json({
        success: true,
        message: 'No unassigned submissions to assign',
        data: { assigned: 0, editors: 0 }
      })
    }
    
    // Even distribution algorithm
    // Example: 100 submissions ÷ 10 editors = 10 per editor
    const editorIds = editors.map(e => e._id)
    const totalSubmissions = allUnassigned.length
    const totalEditors = editorIds.length
    const submissionsPerEditor = Math.floor(totalSubmissions / totalEditors)
    const remainder = totalSubmissions % totalEditors
    
    let assignedCount = 0
    let editorIndex = 0
    
    // Distribute submissions evenly in round-robin fashion
    for (const submission of allUnassigned) {
      const editorId = editorIds[editorIndex % editorIds.length]
      
      await submission.model.findByIdAndUpdate(submission.id, {
        assignedEditor: editorId,
        assignedBy: chiefEditorId,
        assignedAt: new Date(),
        status: submission.type === 'paper' ? 'under-review' : 'under-review'
      })
      
      assignedCount++
      editorIndex++
    }
    
    res.json({
      success: true,
      message: `Successfully distributed ${assignedCount} submissions evenly among ${totalEditors} editors`,
      data: {
        assigned: assignedCount,
        editors: totalEditors,
        perEditor: submissionsPerEditor,
        remainder: remainder,
        distribution: `${submissionsPerEditor} submissions per editor${remainder > 0 ? `, ${remainder} editor${remainder > 1 ? 's' : ''} get 1 extra` : ''}`
      }
    })
  } catch (error) {
    console.error('Error auto-assigning submissions:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to auto-assign submissions',
      error: error.message
    })
  }
}

/**
 * Manually assign manuscript to specific editor
 * POST /api/chief-editor/assign-manuscript/:manuscriptId
 */
export const assignManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    const { editorId } = req.body
    const chiefEditorId = req.user._id
    
    if (!editorId) {
      return res.status(400).json({
        success: false,
        message: 'Editor ID is required'
      })
    }
    
    // Verify editor exists and has editor role
    const editor = await User.findOne({ _id: editorId, role: 'editor' })
    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Editor not found'
      })
    }
    
    // Find and update manuscript
    const manuscript = await Manuscript.findByIdAndUpdate(
      manuscriptId,
      {
        assignedEditor: editorId,
        assignedBy: chiefEditorId,
        assignedAt: new Date(),
        status: 'under-review'
      },
      { new: true }
    )
      .populate('assignedEditor', 'email profile')
      .populate('assignedBy', 'email profile')
    
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Manuscript assigned successfully',
      data: manuscript
    })
  } catch (error) {
    console.error('Error assigning manuscript:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to assign manuscript',
      error: error.message
    })
  }
}

/**
 * Manually assign research paper to specific editor
 * POST /api/chief-editor/assign-paper/:paperId
 */
export const assignResearchPaper = async (req, res) => {
  try {
    const { paperId } = req.params
    const { editorId } = req.body
    const chiefEditorId = req.user._id
    
    if (!editorId) {
      return res.status(400).json({
        success: false,
        message: 'Editor ID is required'
      })
    }
    
    // Verify editor exists and has editor role
    const editor = await User.findOne({ _id: editorId, role: 'editor' })
    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Editor not found'
      })
    }
    
    // Find and update research paper
    const paper = await ResearchPaper.findByIdAndUpdate(
      paperId,
      {
        assignedEditor: editorId,
        assignedBy: chiefEditorId,
        assignedAt: new Date(),
        status: 'under-review'
      },
      { new: true }
    )
      .populate('assignedEditor', 'email profile')
      .populate('assignedBy', 'email profile')
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Research paper assigned successfully',
      data: paper
    })
  } catch (error) {
    console.error('Error assigning research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to assign research paper',
      error: error.message
    })
  }
}

/**
 * Reassign manuscript to different editor
 * PUT /api/chief-editor/reassign-manuscript/:manuscriptId
 */
export const reassignManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    const { editorId } = req.body
    const chiefEditorId = req.user._id
    
    if (!editorId) {
      return res.status(400).json({
        success: false,
        message: 'Editor ID is required'
      })
    }
    
    // Verify editor exists
    const editor = await User.findOne({ _id: editorId, role: 'editor' })
    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Editor not found'
      })
    }
    
    const manuscript = await Manuscript.findByIdAndUpdate(
      manuscriptId,
      {
        assignedEditor: editorId,
        assignedBy: chiefEditorId,
        assignedAt: new Date()
      },
      { new: true }
    )
      .populate('assignedEditor', 'email profile')
      .populate('assignedBy', 'email profile')
    
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Manuscript reassigned successfully',
      data: manuscript
    })
  } catch (error) {
    console.error('Error reassigning manuscript:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reassign manuscript',
      error: error.message
    })
  }
}

/**
 * Reassign research paper to different editor
 * PUT /api/chief-editor/reassign-paper/:paperId
 */
export const reassignResearchPaper = async (req, res) => {
  try {
    const { paperId } = req.params
    const { editorId } = req.body
    const chiefEditorId = req.user._id
    
    if (!editorId) {
      return res.status(400).json({
        success: false,
        message: 'Editor ID is required'
      })
    }
    
    // Verify editor exists
    const editor = await User.findOne({ _id: editorId, role: 'editor' })
    if (!editor) {
      return res.status(404).json({
        success: false,
        message: 'Editor not found'
      })
    }
    
    const paper = await ResearchPaper.findByIdAndUpdate(
      paperId,
      {
        assignedEditor: editorId,
        assignedBy: chiefEditorId,
        assignedAt: new Date()
      },
      { new: true }
    )
      .populate('assignedEditor', 'email profile')
      .populate('assignedBy', 'email profile')
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Research paper reassigned successfully',
      data: paper
    })
  } catch (error) {
    console.error('Error reassigning research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to reassign research paper',
      error: error.message
    })
  }
}

/**
 * Remove editor assignment from manuscript
 * DELETE /api/chief-editor/unassign-manuscript/:manuscriptId
 */
export const unassignManuscript = async (req, res) => {
  try {
    const { manuscriptId } = req.params
    
    const manuscript = await Manuscript.findByIdAndUpdate(
      manuscriptId,
      {
        assignedEditor: null,
        assignedBy: null,
        assignedAt: null,
        status: 'pending'
      },
      { new: true }
    )
    
    if (!manuscript) {
      return res.status(404).json({
        success: false,
        message: 'Manuscript not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Editor unassigned from manuscript',
      data: manuscript
    })
  } catch (error) {
    console.error('Error unassigning manuscript:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to unassign manuscript',
      error: error.message
    })
  }
}

/**
 * Remove editor assignment from research paper
 * DELETE /api/chief-editor/unassign-paper/:paperId
 */
export const unassignResearchPaper = async (req, res) => {
  try {
    const { paperId } = req.params
    
    const paper = await ResearchPaper.findByIdAndUpdate(
      paperId,
      {
        assignedEditor: null,
        assignedBy: null,
        assignedAt: null,
        status: 'completed'
      },
      { new: true }
    )
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Research paper not found'
      })
    }
    
    res.json({
      success: true,
      message: 'Editor unassigned from research paper',
      data: paper
    })
  } catch (error) {
    console.error('Error unassigning research paper:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to unassign research paper',
      error: error.message
    })
  }
}

/**
 * Get dashboard statistics for chief editor
 * GET /api/chief-editor/stats
 */
export const getChiefEditorStats = async (req, res) => {
  try {
    const [
      totalManuscripts,
      assignedManuscripts,
      totalPapers,
      assignedPapers,
      totalEditors,
      pendingManuscripts,
      pendingPapers
    ] = await Promise.all([
      Manuscript.countDocuments(),
      Manuscript.countDocuments({ assignedEditor: { $ne: null } }),
      ResearchPaper.countDocuments({ status: { $ne: 'draft' } }),
      ResearchPaper.countDocuments({ assignedEditor: { $ne: null } }),
      User.countDocuments({ role: 'editor' }),
      Manuscript.countDocuments({ status: 'pending' }),
      ResearchPaper.countDocuments({ status: 'pending' })
    ])
    
    res.json({
      success: true,
      data: {
        manuscripts: {
          total: totalManuscripts,
          assigned: assignedManuscripts,
          unassigned: totalManuscripts - assignedManuscripts,
          pending: pendingManuscripts
        },
        papers: {
          total: totalPapers,
          assigned: assignedPapers,
          unassigned: totalPapers - assignedPapers,
          pending: pendingPapers
        },
        editors: totalEditors,
        avgWorkload: totalEditors > 0 
          ? Math.round((assignedManuscripts + assignedPapers) / totalEditors) 
          : 0
      }
    })
  } catch (error) {
    console.error('Error fetching chief editor stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    })
  }
}
