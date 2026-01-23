/**
 * Generate a random OTP (One-Time Password)
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789'
  let otp = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length)
    otp += digits[randomIndex]
  }
  
  return otp
}

/**
 * Generate a random alphanumeric OTP
 * @param {number} length - Length of the OTP (default: 8)
 * @returns {string} - Generated alphanumeric OTP
 */
export const generateAlphanumericOTP = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let otp = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    otp += characters[randomIndex]
  }
  
  return otp
}

/**
 * Verify if OTP matches
 * @param {string} inputOtp - OTP provided by user
 * @param {string} storedOtp - OTP stored in system
 * @returns {boolean} - True if OTP matches
 */
export const verifyOTP = (inputOtp, storedOtp) => {
  return inputOtp === storedOtp
}
