import app from '../src/app.js'

// Vercel serverless function handler
export default async (req, res) => {
  // Set CORS headers before passing to Express
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://astounding-arithmetic-ef6af9.netlify.app',
    'https://planninginsights.com'
  ]
  
  const origin = req.headers.origin
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  } else if (origin) {
    // For development, allow all origins
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  // Pass to Express app
  return app(req, res)
}
