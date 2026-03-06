# Article Approval & Publishing Workflow - Testing Guide

## 🎯 Complete Workflow Overview

```
User Submits Article → Admin Reviews → Admin Approves → Published on Newsroom
```

## ✅ What Has Been Implemented

### Backend (Complete)
✅ Article model with complete approval workflow
✅ Admin approval endpoint: `PUT /api/admin/articles/:id/status`
✅ Public published articles endpoint: `GET /api/newsroom/articles/published`
✅ Article detail endpoint: `GET /api/newsroom/articles/:id`
✅ Approval sets: `status='published'`, `approvalStatus='approved'`, `isPublished=true`, `publishedAt=Date`

### Frontend (Complete)
✅ Admin can approve/reject articles from dashboard
✅ Newsroom page fetches published articles
✅ Article cards display with proper data mapping
✅ Article detail page shows full content
✅ Routes configured for `/news/articles/:articleId`

## 🧪 Step-by-Step Testing Guide

### Phase 1: Verify Test Article in Admin Dashboard

1. **Open Browser**
   ```
   http://localhost:5174/admin/login
   ```

2. **Login as Admin**
   - Email: `admin@planning-insights.com`
   - Password: `Admin@123`

3. **Navigate to Newsroom Management**
   - Click "Newsroom" in admin sidebar
   - Default filter: **Pending** approval status

4. **Verify Test Article Appears**
   - Should see: "Test Article for Admin Dashboard"
   - Category: Technology
   - Plagiarism Score: 15% (green)
   - Status: Pending
   - Action buttons: ✓ Approve | ✗ Reject | Delete

### Phase 2: Approve Article

1. **Click "✓ Approve" button** on test article

2. **Backend Processing**
   ```javascript
   // What happens on approval:
   status: 'published'
   approvalStatus: 'approved'
   isPublished: true
   publishedAt: new Date()
   reviewedBy: admin._id
   reviewedAt: new Date()
   ```

3. **Verify Success**
   - Toast notification: "Article approved and published successfully"
   - Article disappears from "Pending" filter
   - Change filter to "Approved" to see the article

### Phase 3: View Published Article on Newsroom

1. **Open Newsroom Page**
   ```
   http://localhost:5174/news
   ```

2. **Check Console Logs** (F12 → Console)
   ```
   === LOADING PUBLISHED ARTICLES ===
   Published articles response: {...}
   Loaded X published articles
   ```

3. **Verify Article Display**
   - Article card should appear in grid
   - Shows: Title, excerpt, category badge, author, publish date
   - Featured image (if available)
   - Engagement buttons (like, bookmark, share)

4. **Click on Article Card** to view full detail

5. **Article Detail Page**
   ```
   http://localhost:5174/news/articles/:articleId
   ```
   - Full article content displayed
   - Author information
   - Publication date
   - Category and tags
   - View count incremented

### Phase 4: Test Complete Workflow (User Submission)

1. **Login as Regular User** (or create new account)
   ```
   http://localhost:5174/login
   ```

2. **Navigate to Article Submission**
   ```
   http://localhost:5174/news/submit
   ```

3. **Fill Article Form**
   - **Title**: Minimum 10 characters
     - Example: "Sustainable Urban Development in 2025"
   
   - **Excerpt**: Minimum 50 characters
     - Example: "An in-depth analysis of sustainable urban planning practices and their impact on modern city development"
   
   - **Content**: Minimum 200 characters (use WYSIWYG editor)
     - Write or paste substantial content
   
   - **Category**: Select from dropdown
     - Example: "Urban & Regional Planning"
   
   - **Tags**: Add at least 1 tag
     - Example: urban, sustainability, planning
   
   - **Featured Image**: Upload image (optional)
     - Supported: JPEG, PNG, GIF, WebP
     - Max size: 10MB

4. **Run Plagiarism Check**
   - Click "Check Plagiarism" button
   - Wait 3 seconds for mock check
   - Should show score < 30%

5. **Submit Article**
   - Click "Submit for Review" button
   - **Console logs to verify**:
     ```
     === SUBMITTING ARTICLE ===
     Form Data: {title, excerpt, content, ...}
     === API Call ===
     Response: {success: true, data: {...}}
     ```

6. **Backend Creates Article**
   ```javascript
   // Article created with:
   status: 'pending'
   approvalStatus: 'pending'
   isPublished: false
   author: userId
   ```

7. **Switch to Admin Dashboard**
   - Login as admin
   - Go to Newsroom Management
   - Filter: Pending
   - Your submitted article should appear

8. **Admin Approves Article**
   - Click "✓ Approve"
   - Article status changes to approved/published

9. **View on Newsroom**
   - Go to `/news`
   - Your article now appears in public newsroom

## 🔍 Verification Checklist

### Backend Verification
```bash
# Check articles in database
cd backend
node src/scripts/checkArticles.js
```

**Expected Output:**
```
=== ALL ARTICLES IN DATABASE ===
Total articles: 2

Article 1:
  ID: 6954d71d0ea0ffc98c5e3140
  Title: Test Article for Admin Dashboard
  Status: published
  ApprovalStatus: approved
  
Article 2:
  ID: ...
  Title: Sustainable Urban Development in 2025
  Status: published
  ApprovalStatus: approved

=== PENDING ARTICLES ===
Count: 0

=== APPROVED ARTICLES ===
Count: 2
```

### Frontend Console Logs

**Article Submission:**
```javascript
=== SUBMITTING ARTICLE ===
Form Data: {
  title: "Sustainable Urban Development in 2025",
  excerpt: "...",
  content: "...",
  category: "urban-regional-planning",
  tags: ["urban", "sustainability"],
  isPublished: false,
  plagiarismScore: 15
}
=== API Call ===
POST /api/newsroom/articles
Response: {success: true, message: "Article submitted successfully"}
```

**Admin Dashboard:**
```javascript
=== LOADING ARTICLES ===
Query params: {page: 1, limit: 20, approvalStatus: 'pending'}
Response: {success: true, data: {articles: [...], pagination: {...}}}
Articles count: 1
```

**Newsroom Page:**
```javascript
=== LOADING PUBLISHED ARTICLES ===
Published articles response: {success: true, data: {articles: [...]}}
Loaded 2 published articles
```

**Article Detail:**
```javascript
=== LOADING ARTICLE DETAIL ===
Article ID: 6954d71d0ea0ffc98c5e3140
Article response: {success: true, data: {article: {...}}}
Article loaded: Test Article for Admin Dashboard
```

## 🚀 Quick Test Sequence

1. **Start Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Admin Approval Test**
   ```
   http://localhost:5174/admin/login
   → Login → Newsroom → Approve test article
   ```

3. **View Published Article**
   ```
   http://localhost:5174/news
   → Should see approved article
   → Click article → View full details
   ```

4. **Submit New Article**
   ```
   http://localhost:5174/news/submit
   → Fill form → Plagiarism check → Submit
   ```

5. **Verify in Admin**
   ```
   http://localhost:5174/admin
   → Newsroom → See new pending article → Approve
   ```

6. **Confirm Published**
   ```
   http://localhost:5174/news
   → Refresh → See newly published article
   ```

## 📊 Database Queries (Direct MongoDB)

### Check Articles
```javascript
// In MongoDB shell or Compass
use planning_insights

// All articles
db.articles.find({})

// Published articles
db.articles.find({
  status: 'published',
  approvalStatus: 'approved',
  isPublished: true
})

// Pending articles
db.articles.find({
  approvalStatus: 'pending'
})
```

## 🐛 Troubleshooting

### Articles Not Showing in Newsroom

1. **Check Backend Response**
   ```bash
   curl http://localhost:3000/api/newsroom/articles/published
   ```

2. **Verify Database**
   ```bash
   cd backend
   node src/scripts/checkArticles.js
   ```

3. **Check Frontend Console**
   - Open browser console (F12)
   - Look for errors or empty responses

### Approval Not Working

1. **Check Admin Token**
   - Open DevTools → Application → LocalStorage
   - Verify `authToken` exists

2. **Check Backend Logs**
   - Look for "=== ADMIN UPDATING ARTICLE STATUS ===" log
   - Verify article ID and status update

### Article Detail Page Not Loading

1. **Verify Route**
   - URL should be `/news/articles/:articleId`
   - Article ID should be MongoDB ObjectId format

2. **Check API Response**
   ```bash
   curl http://localhost:3000/api/newsroom/articles/:articleId
   ```

## 🔧 API Endpoints Reference

### Public Endpoints
- `GET /api/newsroom/articles/published` - Get all published articles
- `GET /api/newsroom/articles/:id` - Get article by ID

### Authenticated Endpoints
- `POST /api/newsroom/articles` - Submit article (requires auth)
- `GET /api/newsroom/my-articles` - Get user's articles

### Admin Endpoints
- `GET /api/admin/articles` - Get all articles with filters
- `GET /api/admin/articles/pending/all` - Get pending articles
- `PATCH /api/admin/articles/:id/status` - Update article status
  ```json
  {
    "approvalStatus": "approved" | "rejected",
    "reason": "Optional rejection reason"
  }
  ```
- `DELETE /api/admin/articles/:id` - Delete article

## ✨ Features Implemented

### Article Submission
✅ WYSIWYG editor with ReactQuill
✅ Plagiarism checking (mock - 0-30% score)
✅ Document upload support
✅ Image upload with preview
✅ Form validation (title, excerpt, content length)
✅ Category and tags
✅ Co-authors support

### Admin Management
✅ Filter by approval status (pending/approved/rejected)
✅ Filter by article status (draft/pending/published)
✅ Plagiarism score display with color coding
✅ Approve articles with one click
✅ Reject articles with reason
✅ Delete articles
✅ Pagination

### Public Newsroom
✅ Display published articles only
✅ Category filtering
✅ Search functionality
✅ Sort by latest/popular/trending
✅ Article cards with metadata
✅ Featured article section
✅ Article detail view with full content

## 📝 Admin Credentials

```
Email: admin@planning-insights.com
Password: Admin@123
```

## 🎨 UI Features

### Newsroom Page
- **Category Pills**: Browse by 10 built environment categories
- **Search Bar**: Real-time search by title, content, tags, author
- **Filters**: Type (all/news/research/case-study), Sort (latest/popular/trending)
- **Article Cards**: Featured image, title, excerpt, author, date, engagement stats
- **Featured Section**: Highlights top article with large card

### Article Detail Page
- **Full Content**: Complete article with formatted text
- **Author Info**: Profile, email, bio
- **Metadata**: Category, tags, views, publish date
- **Interactions**: Like, bookmark, share, flag
- **Comments Section**: Add and view comments (if implemented)
- **Related Articles**: Sidebar with similar content

## 🚀 Next Steps (Optional Enhancements)

1. **Real Plagiarism API**: Replace mock with Turnitin/Copyscape
2. **Social Sharing**: Implement share buttons with actual social media APIs
3. **Cloud Storage**: Move uploads to AWS S3 or Cloudinary
4. **Comments**: Enable commenting on articles
5. **Reactions**: Add more reaction types (love, insightful, etc.)
6. **Bookmarks**: Save bookmarks to user profile
7. **Newsletter**: Email notifications for new articles
8. **Analytics**: Track views, engagement, popular topics

---

**Last Updated**: December 31, 2025
**System Status**: ✅ Fully Functional
**Test Article**: Created and ready for approval testing
