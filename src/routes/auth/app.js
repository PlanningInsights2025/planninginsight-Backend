import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/database.js'
import authRoutes from './routes/auth/authRoutes.js'
import linkedinAuthRoutes from './routes/auth/linkedinRoutes.js'
import adminAuthRoutes from './routes/admin/adminAuthRoutes.js'
import adminRoutes from './routes/admin/adminRoutes.js'
dotenv.config()

const app = express()

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ ok: true }))
// Database connection
connectDB(process.env.MONGODB_URI)

// Order matters: mount auth (unprotected) before protected admin routes
app.use('/api/auth', authRoutes)
app.use('/api/auth', linkedinAuthRoutes)
app.use('/api/admin', adminAuthRoutes) // /api/admin/login (unprotected)
app.use('/api/admin', adminRoutes) // protected (requireAdmin)

export default app