import { v4 as uuidv4 } from 'uuid'
import { sendMail } from '../../config/email.js'
import { updateFirebaseUserPassword } from '../../config/firebaseAdmin.js'

// In-memory store (replace with DB in production)
const users = new Map() // email -> { passwordHash?, resetToken, otp, otpExpires, tokenExpires }

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function ttl(minutes) { return Date.now() + minutes * 60 * 1000 }

export async function forgotPassword(req, res) {
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ message: 'Email is required' })

  const otp = generateOtp()
  const resetToken = uuidv4()
  const record = users.get(email) || {}
  record.otp = otp
  record.otpExpires = ttl(10)
  record.resetToken = resetToken
  record.tokenExpires = ttl(30)
  users.set(email, record)

  const link = `${FRONTEND_URL}/auth/forgot-password?token=${resetToken}`
  const subject = 'Your password reset code and link'
  const html = `
    <p>Hello,</p>
    <p>Your password reset code is <b style="font-size:18px;">${otp}</b>.</p>
    <p>You can also reset your password directly using this link:
      <br/><a href="${link}">${link}</a>
    </p>
    <p>This code and link expire in 10–30 minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `
  try {
    await sendMail({ to: email, subject, html, text: `Code: ${otp}\nLink: ${link}` })
    return res.json({ success: true })
  } catch (e) {
    console.error('sendMail failed:', e)
    return res.status(500).json({ message: 'Failed to send email' })
  }
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body || {}
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })
  const record = users.get(email)
  if (!record || record.otp !== otp || Date.now() > record.otpExpires) {
    return res.status(400).json({ message: 'Invalid or expired code' })
  }
  // Optionally rotate token on successful OTP verification
  const resetToken = uuidv4()
  record.resetToken = resetToken
  record.tokenExpires = ttl(30)
  record.otp = null
  record.otpExpires = 0
  users.set(email, record)
  return res.json({ success: true, token: resetToken })
}

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body || {}
  if (!token || !newPassword) return res.status(400).json({ message: 'Token and newPassword are required' })

  // Find token by scanning store (replace with DB lookup in real app)
  let matchedEmail = null
  for (const [email, record] of users.entries()) {
    if (record.resetToken === token && Date.now() < record.tokenExpires) {
      matchedEmail = email
      break
    }
  }
  if (!matchedEmail) return res.status(400).json({ message: 'Invalid or expired token' })

  const record = users.get(matchedEmail)
  // Here you would hash and persist the password. We'll just store a placeholder hash.
  record.passwordHash = `hashed:${newPassword}`

  // Attempt to sync password with Firebase (if using Firebase Auth for login)
  const fbResult = await updateFirebaseUserPassword(matchedEmail, newPassword)
  if (fbResult?.success) {
    console.log('Firebase password updated for', matchedEmail)
  } else if (fbResult?.skipped) {
    console.log('Skipped Firebase update:', fbResult.reason)
  } else {
    console.warn('Firebase password update failed for', matchedEmail, fbResult?.error)
  }
  record.resetToken = null
  record.tokenExpires = 0
  users.set(matchedEmail, record)

  // Send confirmation email
  try {
    await sendMail({
      to: matchedEmail,
      subject: 'Your password was changed',
      html: `<p>Hello,</p><p>Your password was successfully reset. If this wasn't you, contact support immediately.</p>`,
      text: 'Your password was successfully reset. If this wasn\'t you, contact support immediately.'
    })
  } catch (e) {
    console.warn('Confirmation email failed:', e.message)
  }

  return res.json({ success: true })
}
