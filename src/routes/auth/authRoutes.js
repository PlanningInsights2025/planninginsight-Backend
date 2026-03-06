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

export default router
