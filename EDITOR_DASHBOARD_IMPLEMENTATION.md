# Editor Dashboard Implementation Summary

## Overview
Created a comprehensive editor dashboard system that allows editors and chief editors (instructors) to review and manage manuscript and research paper submissions, similar to the admin review functionality.

## Backend Changes

### 1. New Editor Controller (`backend/src/controllers/editor/editorController.js`)
Created controller with the following endpoints:
- `getAllManuscriptsForEditor()` - Fetch all manuscripts for review
- `getAllResearchPapersForEditor()` - Fetch all research papers for review
- `getManuscriptById()` - Get single submission details
- `reviewManuscript()` - Update manuscript/research paper status and add review comments
- `getEditorDashboardStats()` - Get dashboard statistics

### 2. New Editor Routes (`backend/src/routes/editor/editorRoutes.js`)
Created protected routes that require editor, instructor, or admin role:
- `GET /api/editor/dashboard-stats` - Dashboard statistics
- `GET /api/editor/manuscripts` - List all manuscripts
- `GET /api/editor/manuscripts/:manuscriptId` - Get manuscript details
- `PATCH /api/editor/manuscripts/:manuscriptId/review` - Review manuscript
- `GET /api/editor/research-papers` - List all research papers
- `GET /api/editor/research-papers/:manuscriptId` - Get research paper details
- `PATCH /api/editor/research-papers/:manuscriptId/review` - Review research paper

### 3. Updated App Configuration (`backend/src/app.js`)
- Added editor routes to the Express app: `/api/editor`

## Frontend Changes

### 1. New Editor Dashboard Component (`frontend/src/pages/Editor/EditorDashboard.jsx`)
Features:
- **Two Tabs**: Manuscripts and Research Papers
- **Statistics Cards**: Total submissions, pending, under review, accepted
- **Status Filtering**: Filter by pending, under-review, accepted, rejected
- **Search Functionality**: Search by title or author name
- **Review Modal**: 
  - Change submission status (pending, under-review, accepted, rejected)
  - Add review comments/feedback
  - View submission details
- **Document Download**: Direct download link for submitted documents
- **Real-time Updates**: Fetches latest data after review submission

### 2. Styling (`frontend/src/pages/Editor/EditorDashboard.css`)
- Modern, clean design matching the application theme
- Responsive layout for mobile devices
- Status badges with color coding
- Smooth transitions and hover effects
- Modal overlay for review submissions

### 3. Updated App Routes (`frontend/src/App.jsx`)
- Added route: `/editor/dashboard` → EditorDashboard component
- Imported EditorDashboard component

### 4. Updated User Dashboard (`frontend/src/pages/Dashboard/Dashboard/UserDashboard.jsx`)
- Added "Editor Dashboard" menu item for users with editor, instructor, or admin roles
- Added navigation mapping to `/editor/dashboard`
- Updated role name from "Instructor" to "Chief Editor" in role upgrade request

## Access Control

### Who Can Access:
- **Admin**: Full access to editor dashboard
- **Instructor (Chief Editor)**: Full access to editor dashboard
- **Editor**: Full access to editor dashboard

### Middleware Protection:
- Backend routes use `authenticate` middleware to verify JWT token
- Additional `requireEditor` middleware checks for editor, instructor, or admin role
- 403 Forbidden response for unauthorized users

## Workflow

1. **User submits manuscript/research paper** via Publishing House
2. **Submission goes to editor** for review (status: "pending")
3. **Editor accesses dashboard** at `/editor/dashboard`
4. **Editor reviews submission**:
   - Views document and details
   - Downloads PDF if needed
   - Changes status (under-review, accepted, rejected)
   - Adds review comments/feedback
5. **System updates submission** with editor's decision
6. **Author receives notification** about review status (handled by backend)

## API Endpoints Summary

### Editor Endpoints:
```
GET    /api/editor/dashboard-stats           - Get statistics
GET    /api/editor/manuscripts               - List manuscripts
GET    /api/editor/manuscripts/:id           - Get manuscript
PATCH  /api/editor/manuscripts/:id/review    - Review manuscript
GET    /api/editor/research-papers           - List research papers
GET    /api/editor/research-papers/:id       - Get research paper
PATCH  /api/editor/research-papers/:id/review - Review research paper
```

### Query Parameters:
- `?status=pending|under-review|accepted|rejected` - Filter by status
- `?page=1&limit=10` - Pagination

## Status Workflow

**Manuscript/Research Paper Statuses:**
1. `pending` - Initial submission, awaiting review
2. `under-review` - Editor is reviewing the submission
3. `accepted` - Approved for publication
4. `rejected` - Not approved, with feedback

## Testing Instructions

1. **Backend**: Start server with `npm start`
2. **Frontend**: Start dev server with `npm run dev`
3. **Login**: Use an account with editor, instructor, or admin role
4. **Navigate**: Go to Dashboard → Editor Dashboard menu item
5. **Review**: Click "Review" on any submission to test the review functionality

## Future Enhancements

- Email notifications to authors when reviews are submitted
- Revision request workflow (request changes before accept/reject)
- Multiple reviewers assignment
- Review history tracking
- Comments and discussion threads
- Document annotation tools
- Bulk actions for multiple submissions
- Advanced filtering (by requirement, date range, author)
- Export functionality (CSV, PDF reports)

## Files Created/Modified

### Backend:
- ✅ Created: `backend/src/controllers/editor/editorController.js`
- ✅ Created: `backend/src/routes/editor/editorRoutes.js`
- ✅ Modified: `backend/src/app.js`

### Frontend:
- ✅ Created: `frontend/src/pages/Editor/EditorDashboard.jsx`
- ✅ Created: `frontend/src/pages/Editor/EditorDashboard.css`
- ✅ Modified: `frontend/src/App.jsx`
- ✅ Modified: `frontend/src/pages/Dashboard/Dashboard/UserDashboard.jsx`
