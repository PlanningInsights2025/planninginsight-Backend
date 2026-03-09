import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Helper to safely create directory
const ensureDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  } catch (error) {
    console.warn(`Cannot create directory ${dirPath}:`, error.message)
    // On serverless (Vercel), filesystem is read-only, so use /tmp
    return false
  }
  return true
}

// Configure storage - use /tmp for serverless environments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Try local uploads directory first, fallback to /tmp for serverless
    const uploadsDir = path.join(__dirname, '../../uploads/manuscripts')
    
    if (ensureDir(uploadsDir)) {
      cb(null, uploadsDir)
    } else {
      // Fallback to /tmp for serverless environments like Vercel
      const tmpDir = '/tmp/uploads/manuscripts'
      ensureDir(tmpDir)
      cb(null, tmpDir)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'))
  }
}

// Create multer upload instance for manuscripts
export const uploadManuscript = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
}).single('file')

// Create multer upload instance for article images (featuredImage)
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const articlesDir = path.join(__dirname, '../../uploads/articles')
    
    if (ensureDir(articlesDir)) {
      cb(null, articlesDir)
    } else {
      // Fallback to /tmp for serverless environments
      const tmpDir = '/tmp/uploads/articles'
      ensureDir(tmpDir)
      cb(null, tmpDir)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'article-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'))
  }
}

export const uploadArticleImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (covers both images and documents)
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'featuredImage') {
      imageFilter(req, file, cb);
    } else if (file.fieldname === 'documents') {
      // Accept PDF, DOC, DOCX for article documents
      const allowedDocs = /pdf|doc|docx/;
      const extOk = allowedDocs.test(path.extname(file.originalname).toLowerCase());
      if (extOk) cb(null, true);
      else cb(new Error('Only PDF, DOC, and DOCX files are allowed as documents'));
    } else {
      cb(null, true);
    }
  }
}).fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]);

// Middleware wrapper with error handling for manuscripts
export const handleUpload = (req, res, next) => {
  uploadManuscript(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      })
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
    next()
  })
}

// Middleware wrapper with error handling for article images
export const handleArticleUpload = (req, res, next) => {
  uploadArticleImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      })
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
    next()
  })
}
