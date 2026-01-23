import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../../models/User.js'
import { sendMail } from '../../config/email.js'
import { generateOTP } from '../../utils/otpGenerator.js'
import { 
  generateOTP as generateOTPCode, 
  generateOTPExpiry, 
  isOTPExpired, 
  isValidOTPFormat,
  canRequestNewOTP,
  getRemainingCooldown,
  hasExceededOTPAttempts 
} from '../../utils/otpService.js'
import { generateOTPEmail, generateOTPEmailText } from '../../utils/emailTemplates.js'

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map()

/**
 * Step 1: Request OTP for Login
 * Send OTP to user's email
 */
export const requestLoginOTP = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email' 
      })
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is not active. Please contact support.' 
      })
    }

    // Check rate limiting
    if (!canRequestNewOTP(user.lastOtpSent)) {
      const remaining = getRemainingCooldown(user.lastOtpSent)
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${remaining} seconds before requesting a new OTP`,
        remainingSeconds: remaining
      })
    }

    // Generate OTP
    const otpCode = generateOTPCode()
    const otpExpiry = generateOTPExpiry()

    // Save OTP to database
    user.otpCode = otpCode
    user.otpExpiry = otpExpiry
    user.otpAttempts = 0
    user.lastOtpSent = new Date()
    await user.save()

    // Send OTP email
    const userName = user.profile?.firstName || user.email.split('@')[0]
    const emailHtml = generateOTPEmail(otpCode, userName)
    const emailText = generateOTPEmailText(otpCode, userName)

    await sendMail({
      to: user.email,
      subject: 'Your Login OTP - Planning Insights',
      html: emailHtml,
      text: emailText
    })

    console.log(`✅ OTP sent to ${user.email}: ${otpCode}`) // Dev only

    res.json({
      success: true,
      message: 'OTP sent to your email',
      data: {
        email: user.email,
        expiresIn: 600 // 10 minutes in seconds
      }
    })
  } catch (error) {
    console.error('Request OTP error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP' 
    })
  }
}

/**
 * Step 2: Verify OTP and Complete Login
 */
export const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      })
    }

    // Validate OTP format
    if (!isValidOTPFormat(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP format. Must be 6 digits.' 
      })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid credentials' 
      })
    }

    // Check if OTP exists
    if (!user.otpCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found. Please request a new one.' 
      })
    }

    // Check if too many attempts
    if (hasExceededOTPAttempts(user.otpAttempts)) {
      user.otpCode = null
      user.otpExpiry = null
      user.otpAttempts = 0
      await user.save()
      
      return res.status(429).json({ 
        success: false, 
        message: 'Too many failed attempts. Please request a new OTP.' 
      })
    }

    // Check if expired
    if (isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      })
    }

    // Verify OTP
    if (user.otpCode !== otp) {
      user.otpAttempts += 1
      await user.save()
      
      const remaining = 5 - user.otpAttempts
      return res.status(401).json({ 
        success: false, 
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
        remainingAttempts: remaining
      })
    }

    // OTP is valid! Complete login
    user.emailVerified = true
    user.lastLogin = new Date()
    user.otpCode = null
    user.otpExpiry = null
    user.otpAttempts = 0
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          emailVerified: user.emailVerified
        }
      }
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP' 
    })
  }
}

// User Login (legacy - kept for backward compatibility)
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      })
    }

    // Find user by email
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }

    // Prevent admin users from logging in through regular user login
    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin accounts must login through the admin portal at /admin/login' 
      })
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is not active. Please contact support.' 
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login' 
    })
  }
}

/**
 * Step 1: Request Signup OTP
 * User provides email and receives OTP for verification
 */
export const requestSignupOTP = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      })
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser && existingUser.emailVerified) {
      return res.status(409).json({ 
        success: false, 
        message: 'An account with this email already exists. Please login instead.' 
      })
    }

    // If user exists but not verified, allow resending OTP
    let user = existingUser

    if (!user) {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create new user with pending status
      user = new User({
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'user',
        profile: {
          firstName: firstName || '',
          lastName: lastName || ''
        },
        status: 'pending',
        emailVerified: false
      })
    } else {
      // Update password if provided for existing unverified user
      if (password) {
        user.password = await bcrypt.hash(password, 10)
      }
      if (firstName) user.profile.firstName = firstName
      if (lastName) user.profile.lastName = lastName
    }

    // Check rate limiting
    if (!canRequestNewOTP(user.lastOtpSent)) {
      const remaining = getRemainingCooldown(user.lastOtpSent)
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${remaining} seconds before requesting a new OTP`,
        remainingSeconds: remaining
      })
    }

    // Generate OTP
    const otpCode = generateOTPCode()
    const otpExpiry = generateOTPExpiry()

    // Save OTP to database
    user.otpCode = otpCode
    user.otpExpiry = otpExpiry
    user.otpAttempts = 0
    user.lastOtpSent = new Date()
    await user.save()

    // Send verification email
    const userName = firstName || email.split('@')[0]
    const emailHtml = generateOTPEmail(otpCode, userName, 'signup')
    const emailText = generateOTPEmailText(otpCode, userName, 'signup')

    await sendMail({
      to: user.email,
      subject: 'Verify Your Email - Planning Insights',
      html: emailHtml,
      text: emailText
    })

    console.log(`✅ Signup OTP sent to ${user.email}: ${otpCode}`) // Dev only

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      data: {
        email: user.email,
        expiresIn: 600 // 10 minutes in seconds
      }
    })
  } catch (error) {
    console.error('Request signup OTP error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification code' 
    })
  }
}

/**
 * Step 2: Verify Signup OTP
 * User submits OTP to verify email and activate account
 */
export const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      })
    }

    // Validate OTP format
    if (!isValidOTPFormat(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP format. Please enter a 6-digit code.' 
      })
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email' 
      })
    }

    // Check if already verified
    if (user.emailVerified && user.status === 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already verified. Please login instead.' 
      })
    }

    // Check if OTP exists
    if (!user.otpCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'No verification code found. Please request a new one.' 
      })
    }

    // Check if OTP is expired
    if (isOTPExpired(user.otpExpiry)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Verification code has expired. Please request a new one.' 
      })
    }

    // Check attempt limit
    if (hasExceededOTPAttempts(user.otpAttempts)) {
      // Clear OTP to force new request
      user.otpCode = null
      user.otpExpiry = null
      user.otpAttempts = 0
      await user.save()

      return res.status(429).json({ 
        success: false, 
        message: 'Too many failed attempts. Please request a new verification code.' 
      })
    }

    // Verify OTP
    if (user.otpCode !== otp.trim()) {
      // Increment attempt counter
      user.otpAttempts += 1
      await user.save()

      const remainingAttempts = 5 - user.otpAttempts

      return res.status(401).json({ 
        success: false, 
        message: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
        remainingAttempts
      })
    }

    // OTP is valid - activate account
    user.emailVerified = true
    user.status = 'active'
    user.otpCode = null
    user.otpExpiry = null
    user.otpAttempts = 0
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    console.log(`✅ Email verified for ${user.email}`)

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! Welcome to Planning Insights.',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          emailVerified: user.emailVerified,
          status: user.status
        }
      }
    })
  } catch (error) {
    console.error('Verify signup OTP error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify code' 
    })
  }
}

// Legacy User Signup (DEPRECATED - use OTP flow instead)
export const userSignup = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Direct signup is disabled. Please use the email verification flow: /request-signup-otp and /verify-signup'
  })
}

// User Logout
export const userLogout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. However, you can implement token blacklisting
    // if needed using Redis or a database.
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during logout' 
    })
  }
}

// Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      })
    }

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code'
      })
    }

    // Generate OTP
    const otp = generateOTP()
    
    // Store OTP with expiry (5 minutes)
    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    })

    // Send OTP via email
    try {
      await sendMail({
        to: email,
        subject: 'Password Reset OTP',
        html: `
          <h2>Password Reset Request</h2>
          <p>Your OTP for password reset is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      })
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Continue even if email fails (for development)
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset code'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while processing your request' 
    })
  }
}

// Verify OTP
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and OTP are required' 
      })
    }

    // Check if OTP exists and is valid
    const storedOtpData = otpStore.get(email)
    
    if (!storedOtpData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      })
    }

    // Check if OTP is expired
    if (Date.now() > storedOtpData.expiresAt) {
      otpStore.delete(email)
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired' 
      })
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      })
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { email, purpose: 'password-reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    )

    // Delete OTP after successful verification
    otpStore.delete(email)

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: { resetToken }
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while verifying OTP' 
    })
  }
}

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token and new password are required' 
      })
    }

    // Verify reset token
    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      })
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token' 
      })
    }

    // Find user
    const user = await User.findOne({ email: decoded.email })
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    // Update password
    user.password = hashedPassword
    await user.save()

    res.json({
      success: true,
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while resetting password' 
    })
  }
}

/**
 * Google Sign-In Handler
 * Creates or updates user from Google OAuth and returns JWT token
 */
export const googleLogin = async (req, res) => {
  try {
    console.log('🔵 Google login request received:', req.body);
    const { uid, email, displayName, photoURL } = req.body

    if (!uid || !email) {
      console.log('❌ Missing required fields:', { uid: !!uid, email: !!email });
      return res.status(400).json({ 
        success: false, 
        message: 'Firebase UID and email are required' 
      })
    }

    console.log('✅ Valid request, finding/creating user...');
    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase().trim() })
    
    if (!user) {
      // Create new user from Google sign-in
      console.log('📝 Creating new user from Google sign-in...');
      const [firstName, ...lastNameParts] = (displayName || email).split(' ')
      user = new User({
        email: email.toLowerCase().trim(),
        emailVerified: true,
        authProvider: 'google',
        firebaseUid: uid,
        profile: {
          firstName: firstName || email.split('@')[0],
          lastName: lastNameParts.join(' ') || '',
          avatar: photoURL || null
        },
        status: 'active',
        lastLogin: new Date()
      })
      await user.save()
      console.log(`✅ New user created from Google: ${email}`)
    } else {
      // Update existing user
      console.log('✅ Existing user found, updating...');
      user.lastLogin = new Date()
      user.emailVerified = true
      if (!user.firebaseUid) {
        user.firebaseUid = uid
      }
      if (photoURL && !user.profile.avatar) {
        user.profile.avatar = photoURL
      }
      await user.save()
      console.log(`✅ Existing user logged in with Google: ${email}`)
    }

    // Generate JWT token
    console.log('🔐 Generating JWT token...');
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    console.log('✅ JWT token generated successfully');
    res.json({
      success: true,
      message: 'Google sign-in successful',
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      }
    })
  } catch (error) {
    console.error('❌ Google login error:', error)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process Google sign-in',
      error: error.message 
    })
  }
}
