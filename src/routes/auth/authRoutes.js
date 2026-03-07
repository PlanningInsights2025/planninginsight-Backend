import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import User from '../../models/User.js'
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

// Google OAuth — server-side redirect flow
router.get('/google', (req, res) => {
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL || 'https://planninginsight-backend.vercel.app'}/api/auth/google/callback`
  )
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile']
  })
  res.redirect(url)
})

router.get('/google/callback', async (req, res) => {
  const FRONTEND = process.env.FRONTEND_URL || 'https://theplanninginsights.com'
  try {
    const { code } = req.query
    if (!code) return res.redirect(`${FRONTEND}/login?error=no_code`)

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL || 'https://planninginsight-backend.vercel.app'}/api/auth/google/callback`
    )
    const { tokens } = await client.getToken(code)
    client.setCredentials(tokens)

    // Get user info from id_token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const { sub: googleId, email, given_name, family_name, picture } = ticket.getPayload()

    if (!email) return res.redirect(`${FRONTEND}/login?error=no_email`)

    let user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      user = new User({
        email: email.toLowerCase().trim(),
        emailVerified: true,
        authProvider: 'google',
        googleId,
        profile: { firstName: given_name || email.split('@')[0], lastName: family_name || '', avatar: picture || null },
        status: 'active',
        lastLogin: new Date()
      })
      await user.save()
    } else {
      user.lastLogin = new Date()
      user.emailVerified = true
      if (!user.googleId) user.googleId = googleId
      if (picture && !user.profile?.avatar) user.profile.avatar = picture
      await user.save()
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Redirect to frontend with token in URL fragment (never logged by servers)
    res.redirect(`${FRONTEND}/auth/callback#token=${token}&userId=${user._id}`)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    res.redirect(`${FRONTEND}/login?error=google_failed`)
  }
})

// Google OAuth login (credential/access_token POST — kept for compatibility)
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
