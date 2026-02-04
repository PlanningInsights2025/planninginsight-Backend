import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import authRoutes from './routes/auth/authRoutes.js'
import linkedinAuthRoutes from './routes/auth/linkedinRoutes.js'
import adminAuthRoutes from './routes/admin/adminAuthRoutes.js'
import adminRoutes from './routes/admin/adminRoutes.js'
import publishingRoutes from './routes/publishing/requirementRoutes.js'
import researchPaperRoutes from './routes/publishing/researchPapers.js'
import articleRoutes from './routes/newsroom/articleRoutes.js'
import plagiarismRoutes from './routes/newsroom/plagiarismRoutes.js'
import forumRoutes from './routes/forum/forumRoutes.js'
import forumAdminRoutes from './routes/admin/forumAdminRoutes.js'
import appealRoutes from './routes/forum/appealRoutes.js'
import editorRoutes from './routes/editor/editorRoutes.js'
import chiefEditorRoutes from './routes/chiefEditor/chiefEditorRoutes.js'
import roleRequestRoutes from './routes/user/roleRequestRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://astounding-arithmetic-ef6af9.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.get('/test', (req, res) => res.send('Server is working!'))
// Database connection (handled in server.js, removed from here to prevent double connection)

// Order matters: mount auth (unprotected) before protected admin routes
app.use('/api/auth', authRoutes)
app.use('/api/auth', linkedinAuthRoutes)
app.use('/api/admin', adminAuthRoutes) // /api/admin/login (unprotected)
app.use('/api/admin', adminRoutes) // protected (requireAdmin)
app.use('/api/admin/forum', forumAdminRoutes) // forum admin routes
app.use('/api/publishing', publishingRoutes) // public publishing routes
app.use('/api/research-papers', researchPaperRoutes) // research papers routes
app.use('/api/newsroom/articles', articleRoutes) // newsroom article routes
app.use('/api/newsroom/plagiarism', plagiarismRoutes) // plagiarism check routes
app.use('/api/forum', forumRoutes) // forum routes
app.use('/api/forum/appeal', appealRoutes) // appeal routes
app.use('/api/editor', editorRoutes) // editor routes for manuscript and research paper review
app.use('/api/chief-editor', chiefEditorRoutes) // chief editor routes for assignment management
app.use('/api/user', roleRequestRoutes) // user role request routes

export default app