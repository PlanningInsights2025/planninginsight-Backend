# Planning Insights - AI Coding Agent Guidelines

## Project Overview
Planning Insights is a full-stack digital knowledge ecosystem for urban planning and built environment professionals. The platform integrates publishing, learning, networking, employment, and data sharing capabilities.

**Stack:** React 18 + Vite (frontend) | Node.js/Express (backend) | Firebase Auth | MongoDB

## Architecture & Module Structure

### Frontend Modules (React Router v6)
The application is organized into seven main feature modules:
- **Job Portal** (`/jobs`) - Employment opportunities and applications
- **Learning Centre** (`/learning`) - Online courses and certifications
- **Publishing House** (`/publishing`) - Manuscript submission and journals
- **Newsroom** (`/news`) - Articles and events
- **Forum** (`/forum`) - Community discussions and threads
- **Networking Arena** (`/networking`) - Professional connections
- **Admin** (`/admin`) - Platform management

Each module has its own directory structure: `components/`, `pages/`, and `services/api/`.

### Backend Services
Located in `backend/src/services/`, organized by functionality:
- `ai/` - AI moderation and content processing
- `blockchain/` - Certificate verification
- `chat/` - Real-time messaging
- `email/` - Notification system
- `payment/` - Razorpay integration
- `storage/` - Cloudinary file management
- `video/` - Video streaming

## Key Patterns & Conventions

### Authentication Flow
- **Dual Auth System:** Firebase for frontend auth + JWT tokens for backend API calls
- Tokens stored in `localStorage` as `authToken`
- Auto-redirect to `/login` on 401 responses (see [frontend/src/services/api/api.js](../frontend/src/services/api/api.js))
- Context providers: `AuthContext` wraps the entire app for user state

### API Communication
- Base axios instance in [frontend/src/services/api/api.js](../frontend/src/services/api/api.js) with token interceptor
- Environment variable: `VITE_API_BASE_URL` (defaults to `http://localhost:3000/api`)
- Each module has dedicated API service file (e.g., `jobs.js`, `learning.js`)

### Code Generation System
Unique identifier pattern using [utils/uniqueCodeGenerator.js](../frontend/src/utils/uniqueCodeGenerator.js):
```javascript
// Examples from the codebase:
generateUserCode('John', 'Doe')      // USR-JD-123456
generateCourseCode('URP')            // CRS-URP-789012
generateManuscriptCode('JPR')       // MAN-JPR-345678
```
Each entity type has a specific prefix and timestamp-based suffix.

### Form Validation
Centralized validation in [frontend/src/utils/validators.js](../frontend/src/utils/validators.js):
- `validateLoginForm()`, `validateSignupForm()`, `validateJobApplication()`, etc.
- Returns `{ isValid: boolean, errors: object }` structure
- Use these validators instead of inline validation logic

### Context Providers
Four global contexts wrap the app (see [App.jsx](../frontend/src/App.jsx)):
1. `ThemeProvider` - Dark/light mode
2. `NotificationProvider` - Toast notifications
3. `AuthProvider` - User authentication state
4. `UserProvider` - Profile and preferences

## Development Workflow

### Running the Application
```bash
# Frontend (Vite dev server on port 5173)
cd frontend
npm run dev

# Backend (Express server on port 3000)
cd backend
npm start
```

### File Upload Handling
- Uses custom `upload.js` middleware for multipart forms
- Cloudinary integration for cloud storage
- Local uploads go to `backend/uploads/` with subfolders by type (profiles, resumes, manuscripts, courses, articles)

### Environment Configuration
Frontend uses Vite environment variables (`VITE_` prefix):
- `VITE_API_BASE_URL` - Backend API endpoint
- `VITE_RAZORPAY_KEY` - Payment gateway
- Firebase config in [config/firebase.js](../frontend/src/config/firebase.js)
- See [config/app.js](../frontend/src/config/app.js) for full configuration reference

## Component Guidelines

### Layout Structure
All pages include `<Header />` and `<Footer />` automatically via App.jsx layout. Don't add them to individual pages.

### Routing Patterns
- Public routes: `/`, `/login`, `/signup`
- Protected routes: Should check authentication via `useAuth()` hook
- Dynamic routes use React Router params: `/jobs/:id`, `/learning/courses/:id`

### Styling Convention
- Component-level CSS files (e.g., `Home.css` alongside `Home.jsx`)
- Global styles in [src/styles/globals.css](../frontend/src/styles/globals.css)
- CSS variables defined in [src/styles/variables.css](../frontend/src/styles/variables.css)
- Material-UI components used alongside custom CSS

## When Creating New Features

1. **New Page:** Add component in `pages/[Module]/`, create route in [App.jsx](../frontend/src/App.jsx), add to header navigation
2. **New API Endpoint:** Create service method in `services/api/[module].js`, add backend route in `routes/[module]/`
3. **New Model:** Define schema in `backend/src/models/`, include in controller imports
4. **File Uploads:** Use existing Cloudinary service, don't reinvent upload logic

## Common Pitfalls to Avoid

- Don't hardcode API URLs; always use `import.meta.env.VITE_API_BASE_URL`
- Use the centralized validators from `utils/validators.js`
- Follow the unique code generator pattern for new entity types
- Always wrap authenticated API calls in try-catch with proper error handling
- Use `react-hot-toast` for notifications, not native alerts
