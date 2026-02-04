import express from 'express'
import { authenticate } from '../../middleware/auth.js'
import { submitRoleRequest, getMyRoleRequests } from '../../controllers/user/roleRequestController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// POST /api/user/role-requests - Submit a role upgrade request
router.post('/role-requests', submitRoleRequest)

// GET /api/user/role-requests - Get user's role requests
router.get('/role-requests', getMyRoleRequests)

export default router
