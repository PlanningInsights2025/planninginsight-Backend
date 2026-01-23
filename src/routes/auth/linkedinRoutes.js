import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../../models/User.js'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()

// Helper: resolve redirect URI safely
function getRedirectUri() {
  const fromEnv = (process.env.LINKEDIN_REDIRECT_URI || '').trim()
  if (fromEnv) return fromEnv
  const port = process.env.PORT || 3000
  const fallback = `http://localhost:${port}/api/auth/linkedin/callback`
  console.warn('[LinkedIn] LINKEDIN_REDIRECT_URI is missing. Using fallback:', fallback)
  return fallback
}

// Helper: build LinkedIn auth URL
function buildAuthUrl() {
  const redirectUri = getRedirectUri()
  const clientId = (process.env.LINKEDIN_CLIENT_ID || '').trim()
  if (!clientId) {
    console.error('[LinkedIn] LINKEDIN_CLIENT_ID is missing')
  }
  // Use standard LinkedIn v2 scopes for basic profile and email
  // Scope note: For OIDC-based Sign In with LinkedIn use: 'openid email profile'.
  // If your app uses legacy v2, use: 'r_liteprofile r_emailaddress' and enable the corresponding product in LinkedIn Dev Portal.
  const scope = (process.env.LINKEDIN_SCOPE || 'openid email profile').trim()
  const params = new URLSearchParams()
  params.set('response_type', 'code')
  params.set('client_id', clientId)
  params.set('redirect_uri', redirectUri)
  params.set('scope', scope)
  params.set('state', Math.random().toString(36).slice(2))
  // Encourage re-consent/account selection when switching accounts
  // Force LinkedIn to show the sign-in screen and not reuse prior session
  // Request both login and consent to maximize chance LinkedIn shows account chooser
  params.set('prompt', 'login consent')
  params.set('max_age', '0')
  // OIDC nonce for replay protection (optional but recommended)
  params.set('nonce', Math.random().toString(36).slice(2))
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`
}

// GET /api/auth/linkedin -> redirect to LinkedIn
router.get('/linkedin', (req, res) => {
  const redirectUri = getRedirectUri()
  const url = buildAuthUrl()
  console.log('[LinkedIn] Using redirect_uri:', redirectUri)
  if (url.includes('redirect_uri=undefined')) {
    console.error('[LinkedIn] Built authorization URL has undefined redirect_uri:', url)
  }
  res.redirect(url)
})

// Optional: expose the built authorization URL for debugging
router.get('/linkedin/url', (req, res) => {
  const url = buildAuthUrl()
  res.json({ url })
})

// GET /api/auth/linkedin/callback -> exchange code, fetch profile, upsert user, issue JWT, redirect to app
router.get('/linkedin/callback', async (req, res) => {
  const { code, error, error_description } = req.query
  if (error) {
    console.error('[LinkedIn] Callback error:', error, error_description)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/login'
    const redirect = new URL(frontendUrl)
    redirect.searchParams.set('social_error', String(error))
    if (error_description) redirect.searchParams.set('social_error_description', String(error_description))
    return res.redirect(redirect.toString())
  }
  if (!code) return res.status(400).send('Missing code')
  try {
    const redirectUri = getRedirectUri()
    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET
      })
    })
    if (!tokenRes.ok) {
      const text = await tokenRes.text()
      throw new Error(`Token exchange failed: ${text}`)
    }
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // For OpenID Connect product, use the OIDC userinfo endpoint
    // Requires scope: openid email profile
    const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!userinfoRes.ok) {
      const text = await userinfoRes.text()
      throw new Error(`Failed to fetch userinfo: ${text}`)
    }
    const userinfo = await userinfoRes.json()
    let email = userinfo?.email
    const sub = userinfo?.sub // OIDC subject identifier
    const givenName = userinfo?.given_name || ''
    const familyName = userinfo?.family_name || ''
    const picture = userinfo?.picture || null
    const name = userinfo?.name || `${givenName} ${familyName}`.trim()

    // Fallback: fetch email via legacy v2 endpoint if OIDC userinfo lacks email
    if (!email) {
      const emailRes = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (emailRes.ok) {
        const emailData = await emailRes.json()
        email = emailData?.elements?.[0]?.['handle~']?.emailAddress || null
      }
    }

    if (!email) throw new Error('Email not available from LinkedIn profile')

    // Upsert user
    const normalizedEmail = String(email).toLowerCase()
    let user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      user = await User.create({ 
        email: normalizedEmail, 
        role: 'user',
        firstName: givenName,
        lastName: familyName,
        displayName: name,
        avatarUrl: picture,
        linkedinSub: sub
      })
    }

    // Issue JWT
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })

    // Redirect back to frontend with token in query
    // Build frontend redirect target; ensure it lands on /login so the token handler runs
    let frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173/login'
    let redirect = new URL(frontendBase)
    if (!redirect.pathname || redirect.pathname === '/' ) {
      // If only an origin is provided, force /login so our login page can capture ?token
      redirect = new URL('/login', redirect.origin)
    }
    redirect.searchParams.set('token', token)
    res.redirect(redirect.toString())
  } catch (e) {
    console.error('LinkedIn callback error', e)
    res.status(500).send('LinkedIn authentication failed')
  }
})

// Add a simple current-user endpoint under /api/auth/me that returns user details from JWT
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization token' })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Handle both 'id' and 'userId' in token payload
    const userId = decoded.id || decoded.userId
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' })
    }
    const user = await User.findById(userId).lean()
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    // Return safe user fields
    const safeUser = {
      id: String(user._id),
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      displayName: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      avatarUrl: user.avatarUrl || null,
      role: user.role || 'user'
    }
    res.json(safeUser)
  } catch (err) {
    console.error('[Auth] /me error:', err)
    res.status(401).json({ message: 'Invalid or expired token' })
  }
})

export default router
