import { Router } from 'express'
import { 
  requestLoginOTP, 
  verifyLoginOTP,
  requestSignupOTP,
  verifySignupOTP,
  forgotPassword, 
  verifyOtp, 
  resetPassword, 
  userLogin, 
  userSignup, 
  userLogout,
  googleLogin 
} from '../../controllers/auth/authController.js'
import { getFirebaseUserByEmail, updateFirebaseUserPassword } from '../../config/firebaseAdmin.js'

const router = Router()

// SIGNUP with Email Verification (PRIMARY METHOD)
router.post('/request-signup-otp', requestSignupOTP)
router.post('/verify-signup', verifySignupOTP)

// LOGIN with OTP Authentication (PRIMARY METHOD)
router.post('/request-login-otp', requestLoginOTP)
router.post('/verify-login-otp', verifyLoginOTP)

// Google OAuth login
router.post('/google-login', googleLogin)

// Legacy authentication routes (DEPRECATED)
router.post('/login', userLogin)
router.post('/signup', userSignup)
router.post('/logout', userLogout)

// Password reset routes
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)

// Social auth routes (OAuth)
router.get('/google', (req, res) => {
  // Implement Google OAuth flow
  res.status(501).json({ message: 'Google OAuth not yet implemented' })
})

router.get('/github', (req, res) => {
  // Implement GitHub OAuth flow
  res.status(501).json({ message: 'GitHub OAuth not yet implemented' })
})

// Optional diagnostics (enable by setting DEBUG_AUTH=true in .env)
router.get('/debug/firebase-user', async (req, res) => {
	if (process.env.DEBUG_AUTH !== 'true') return res.status(404).end()
	const { email } = req.query
	if (!email) return res.status(400).json({ message: 'email is required' })
	const result = await getFirebaseUserByEmail(email)
	if (result.success) return res.json(result.data)
	if (result.skipped) return res.status(500).json({ message: result.reason })
	return res.status(404).json({ message: result.error || 'not found' })
})

router.post('/debug/set-password', async (req, res) => {
	if (process.env.DEBUG_AUTH !== 'true') return res.status(404).end()
	const { email, password } = req.body || {}
	if (!email || !password) return res.status(400).json({ message: 'email and password are required' })
	const result = await updateFirebaseUserPassword(email, password)
	if (result.success) return res.json({ success: true })
	if (result.skipped) return res.status(500).json({ message: result.reason })
	return res.status(500).json({ message: result.error || 'failed' })
})

export default router
