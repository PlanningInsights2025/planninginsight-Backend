import nodemailer from 'nodemailer'

let transporter
let usingEthereal = false

export async function getTransporter() {
  if (transporter) return transporter

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  } else {
    // Developer-friendly fallback: create a disposable Ethereal account
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
    usingEthereal = true
    console.log('Using Ethereal SMTP. Login to preview emails:', testAccount.user)
  }
  try {
    await transporter.verify()
    console.log('SMTP transporter verified')
  } catch (e) {
    console.warn('SMTP verify failed:', e.message)
  }
  return transporter
}

export async function sendMail({ to, subject, html, text, from }) {
  const mailFrom = from || process.env.MAIL_FROM || 'no-reply@planning-insights.local'
  const tx = await getTransporter()
  const info = await tx.sendMail({ from: mailFrom, to, subject, html, text })
  if (usingEthereal) {
    const url = nodemailer.getTestMessageUrl(info)
    console.log('Ethereal preview URL:', url)
  } else {
    console.log('Email sent:', info.messageId)
  }
  return info
}
