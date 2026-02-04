import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import * as editorController from '../../controllers/editor/editorController.js'

const router = Router()

// Middleware to check if user has editor or chief editor role
const requireEditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' })
  }

  // Allow editor, chief editor, or admin roles
  if (req.user.role !== 'editor' && req.user.role !== 'chiefeditor' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Editor, Chief Editor, or Admin role required.' 
    })
  }

  next()
}

// Protect all routes with authentication and editor role check
router.use(authenticate)
router.use(requireEditor)

// ==================== EDITOR DASHBOARD ====================
router.get('/dashboard-stats', editorController.getEditorDashboardStats)

// ==================== MANUSCRIPTS ====================
router.get('/manuscripts', editorController.getAllManuscriptsForEditor)
router.get('/manuscripts/:manuscriptId', editorController.getManuscriptById)
router.patch('/manuscripts/:manuscriptId/review', editorController.reviewManuscript)

// ==================== RESEARCH PAPERS ====================
router.get('/research-papers', editorController.getAllResearchPapersForEditor)
router.get('/research-papers/:manuscriptId', editorController.getManuscriptById) // Same endpoint since they're both in Manuscript collection
router.patch('/research-papers/:manuscriptId/review', editorController.reviewManuscript)

// ==================== ASSIGNMENT-BASED EDITOR ROUTES ====================
// Get assigned manuscripts and papers
router.get('/my-assignments/manuscripts', editorController.getMyAssignedManuscripts)
router.get('/my-assignments/papers', editorController.getMyAssignedResearchPapers)
router.get('/my-assignments/stats', editorController.getMyAssignmentStats)

// Get specific assigned submission details
router.get('/my-assignments/manuscript/:manuscriptId', editorController.getAssignedManuscriptDetails)
router.get('/my-assignments/paper/:paperId', editorController.getAssignedResearchPaperDetails)

// Review assigned submissions
router.post('/my-assignments/review-manuscript/:manuscriptId', editorController.reviewAssignedManuscript)
router.post('/my-assignments/review-paper/:paperId', editorController.reviewAssignedResearchPaper)

// Update remarks for assigned submissions
router.patch('/my-assignments/manuscript/:manuscriptId/remarks', editorController.updateAssignedManuscriptRemarks)
router.patch('/my-assignments/paper/:paperId/remarks', editorController.updateAssignedResearchPaperRemarks)

export default router
