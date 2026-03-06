import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import { requireChiefEditor } from '../../middleware/requireEditor.js'
import * as chiefEditorController from '../../controllers/chiefEditor/chiefEditorController.js'

const router = express.Router()

// All routes require authentication and Chief Editor role
router.use(authenticate)
router.use(requireChiefEditor)

/**
 * Dashboard & Statistics
 */
router.get('/stats', chiefEditorController.getChiefEditorStats)

/**
 * View All Submissions
 */
router.get('/all-submissions', chiefEditorController.getAllSubmissions)

/**
 * Manage Editors
 */
router.get('/editors', chiefEditorController.getAllEditors)

/**
 * Auto-Assign Submissions
 */
router.post('/auto-assign', chiefEditorController.autoAssignSubmissions)

/**
 * Manual Assignment - Manuscripts
 */
router.post('/assign-manuscript/:manuscriptId', chiefEditorController.assignManuscript)

/**
 * Manual Assignment - Research Papers
 */
router.post('/assign-paper/:paperId', chiefEditorController.assignResearchPaper)

/**
 * Reassignment - Manuscripts
 */
router.put('/reassign-manuscript/:manuscriptId', chiefEditorController.reassignManuscript)

/**
 * Reassignment - Research Papers
 */
router.put('/reassign-paper/:paperId', chiefEditorController.reassignResearchPaper)

/**
 * Unassignment - Manuscripts
 */
router.delete('/unassign-manuscript/:manuscriptId', chiefEditorController.unassignManuscript)

/**
 * Unassignment - Research Papers
 */
router.delete('/unassign-paper/:paperId', chiefEditorController.unassignResearchPaper)

export default router
