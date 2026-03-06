import crypto from 'crypto'

/**
 * Generate a secure 6-digit OTP
 */
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString()
}

/**
 * Generate OTP expiry time (10 minutes from now)
 */
export function generateOTPExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000)
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiryDate) {
  return !expiryDate || new Date() > new Date(expiryDate)
}

/**
 * Validate OTP format (6 digits)
 */
export function isValidOTPFormat(otp) {
  return /^\d{6}$/.test(otp)
}

/**
 * Check if user can request new OTP (rate limiting - 60 seconds)
 */
export function canRequestNewOTP(lastOtpSent, cooldownSeconds = 60) {
  if (!lastOtpSent) return true
  const cooldownMs = cooldownSeconds * 1000
  return Date.now() - new Date(lastOtpSent).getTime() > cooldownMs
}

/**
 * Get remaining cooldown time in seconds
 */
export function getRemainingCooldown(lastOtpSent, cooldownSeconds = 60) {
  if (!lastOtpSent) return 0
  const cooldownMs = cooldownSeconds * 1000
  const elapsed = Date.now() - new Date(lastOtpSent).getTime()
  const remaining = cooldownMs - elapsed
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

/**
 * Check if OTP attempts exceeded (max 5 attempts)
 */
export function hasExceededOTPAttempts(attempts, maxAttempts = 5) {
  return attempts >= maxAttempts
}
