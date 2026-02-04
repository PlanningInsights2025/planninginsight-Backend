import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import {
  createResearchPaper,
  getMyResearchPapers,
  getResearchPaperById,
  updateResearchPaper,
  deleteResearchPaper
} from '../../controllers/publishing/researchPaperController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Create a new research paper
router.post('/', createResearchPaper)

// Get all research papers for the logged-in user
router.get('/', getMyResearchPapers)

// Get a single research paper by ID
router.get('/:id', getResearchPaperById)

// Update a research paper
router.put('/:id', updateResearchPaper)

// Delete a research paper
router.delete('/:id', deleteResearchPaper)

export default router
