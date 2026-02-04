/**
 * Generate OTP verification email (HTML)
 */
export function generateOTPEmail(otpCode, userName = 'User', type = 'login') {
  const title = type === 'signup' ? 'Verify Your Email' : 'Your One-Time Password'
  const message = type === 'signup' 
    ? 'Welcome to Planning Insights! Use this code to verify your email and complete registration:'
    : 'Use this One-Time Password to sign in to your account:'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:40px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;color:#fff;font-size:28px;">Planning Insights</h1>
              <p style="margin:10px 0 0;color:#e0e7ff;font-size:16px;">${title}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#1f2937;font-size:16px;">Hello ${userName},</p>
              <p style="margin:0 0 30px;color:#4b5563;font-size:15px;">${message}</p>
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
                <tr>
                  <td style="background:#f9fafb;border:2px solid #6366f1;border-radius:8px;padding:24px;text-align:center;">
                    <p style="margin:0 0 8px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Your Verification Code</p>
                    <p style="margin:0;color:#6366f1;font-size:36px;font-weight:bold;letter-spacing:6px;font-family:monospace;">
                      ${otpCode}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Warning -->
              <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:0 0 20px;border-radius:4px;">
                <p style="margin:0;color:#92400e;font-size:14px;"><strong>⏱️ Expires in 10 minutes</strong><br>Do not share this code with anyone.</p>
              </div>
              <p style="margin:0;color:#6b7280;font-size:14px;">If you didn't request this code, please ignore this email.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px;background:#f9fafb;border-radius:0 0 12px 12px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Planning Insights. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Generate OTP verification email (Plain Text)
 */
export function generateOTPEmailText(otpCode, userName = 'User', type = 'login') {
  const title = type === 'signup' ? 'Verify Your Email' : 'Your One-Time Password'
  const message = type === 'signup' 
    ? 'Welcome to Planning Insights! Use this code to verify your email and complete registration.'
    : 'Use this code to sign in to your account.'

  return `
Planning Insights - ${title}

Hello ${userName},

${message}

VERIFICATION CODE: ${otpCode}

This code expires in 10 minutes.
Do not share this code with anyone.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} Planning Insights
  `.trim()
}
