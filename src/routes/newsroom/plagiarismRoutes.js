import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import { checkPlagiarism } from '../../controllers/newsroom/plagiarismController.js'

const router = express.Router()

/**
 * Check plagiarism
 */
router.post('/check', authenticate, checkPlagiarism)

export default router
