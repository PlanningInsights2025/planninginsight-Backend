# Article Submission & Admin Approval - Complete Guide

## ✅ Current Status

### Backend
- ✅ Running on `http://localhost:3000`
- ✅ MongoDB connected to `planning_insights` database
- ✅ Article model with approval workflow
- ✅ Newsroom routes at `/api/newsroom/articles`
- ✅ Admin routes at `/api/admin/articles`
- ✅ Enhanced logging enabled

### Frontend
- ✅ Running on `http://localhost:5174` (or 5173)
- ✅ Article submission form at `/news/submit`
- ✅ Admin dashboard at `/admin/dashboard`
- ✅ Enhanced logging enabled

### Database
- ✅ **1 Test Article Created** (approvalStatus: 'pending')
- Title: "Test Article for Admin Dashboard"
- Should appear in admin panel immediately

## 🎯 Testing Steps

### 1. View Test Article in Admin Dashboard

**Login as Admin:**
- URL: `http://localhost:5174/admin/login`
- Email: `admin@planning-insights.com`
- Password: `Admin@123`
- Leave 2FA and Security Question fields empty (they're optional)

**Navigate to Newsroom Management:**
- Go to Admin Dashboard
- Click on "Newsroom" or "Newsroom Management"
- You should see: **"Test Article for Admin Dashboard"**
- Default filter is set to "Pending" approval

**Admin Actions Available:**
- ✓ **Approve** - Publishes the article
- ✗ **Reject** - Rejects with reason
- 🗑️ **Delete** - Removes article

### 2. Submit a New Article (User Flow)

**Create User Account (if not already):**
- Go to `http://localhost:5174/signup`
- Register a new account
- OR Login with existing credentials at `http://localhost:5174/login`

**Submit Article:**
1. Navigate to: `http://localhost:5174/news/submit`
2. Fill in the form:
   - **Title** (required, min 10 chars)
   - **Excerpt** (required, min 50 chars)
   - **Content** (required, min 200 chars, use WYSIWYG editor)
   - **Category** (required, select from dropdown)
   - **Tags** (required, at least 1 tag)
   - **Featured Image** (optional)
3. Click **"Check Plagiarism"** button (required)
4. Wait for plagiarism check to complete
5. Click **"Submit for Review"**
6. Check browser console for submission logs

**Expected Logs (Browser Console):**
```
=== SUBMITTING ARTICLE ===
isDraft: false
FormData: { title: "...", category: "...", ... }
Calling API...
API Response: { success: true, message: "Article submitted successfully! Awaiting admin approval." }
```

**Expected Logs (Backend Terminal):**
```
=== ARTICLE SUBMISSION RECEIVED ===
Title: Your Article Title
Category: Technology
isPublished: true
User: { id: '...', email: '...', role: 'user' }
=== ARTICLE CREATED SUCCESSFULLY ===
Article ID: 507f1f77bcf86cd799439011
Status: pending
Approval Status: pending
```

### 3. View Submitted Article in Admin Panel

**Refresh Admin Dashboard:**
- Go back to admin panel
- Refresh Newsroom Management page
- Your newly submitted article should appear with:
  - Status: "pending"
  - Approval Status: "pending"
  - Plagiarism Score: (your score)
  - Approve/Reject buttons visible

**Expected Logs (Backend Terminal):**
```
=== ADMIN FETCHING ARTICLES ===
Query params: { page: '1', limit: '20', approvalStatus: 'pending' }
Filter: { approvalStatus: 'pending' }
Articles found: 2
Total count: 2
Sample article: { id: '...', title: '...', status: 'pending', approvalStatus: 'pending' }
```

**Expected Logs (Browser Console):**
```
=== LOADING ARTICLES ===
Params: { page: 1, limit: 20, approvalStatus: 'pending' }
Response: { success: true, data: { articles: [...], pagination: {...} } }
Articles received: 2
```

## 🔍 Troubleshooting

### Problem: No articles showing in admin panel

**Check 1: Are articles in the database?**
```bash
cd backend
node src/scripts/checkArticles.js
```
Expected output: Shows all articles with their status and approvalStatus

**Check 2: Backend logs**
Look for:
```
=== ADMIN FETCHING ARTICLES ===
Articles found: 0  <-- If 0, no articles match the filter
```

**Check 3: Frontend console**
Look for errors in browser console when loading admin panel

**Check 4: Filter settings**
- Make sure "Pending" is selected in approval status dropdown
- Try selecting "All Approval Status" to see all articles

### Problem: Article submission fails

**Check 1: Authentication**
- Make sure you're logged in
- Check localStorage for 'authToken'
- Try logging out and back in

**Check 2: Form validation**
- Title minimum 10 characters
- Excerpt minimum 50 characters
- Content minimum 200 characters
- At least 1 tag required
- Category must be selected
- Plagiarism check must be completed

**Check 3: Backend errors**
Check backend terminal for error messages after clicking submit

**Check 4: Network errors**
- Open browser DevTools → Network tab
- Try submitting article
- Look for failed requests to `/api/newsroom/articles`
- Check status code and response

## 📊 Database Structure

### Article Schema
```javascript
{
  title: String (required),
  excerpt: String (required),
  content: String (required),
  author: ObjectId (ref: User),
  category: String (required),
  tags: [String],
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'archived',
  approvalStatus: 'pending' | 'approved' | 'rejected',
  isPublished: Boolean,
  plagiarismScore: Number,
  plagiarismReport: {
    checked: Boolean,
    score: Number,
    wordCount: Number,
    matchedSources: Array
  },
  featuredImage: String,
  allowComments: Boolean,
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  rejectionReason: String,
  publishedAt: Date
}
```

## 🔧 Helpful Commands

### Check Articles in Database
```bash
cd backend
node src/scripts/checkArticles.js
```

### Create Test Article
```bash
cd backend
node src/scripts/createTestArticle.js
```

### Restart Backend
```bash
cd backend
npm start
```

### Restart Frontend
```bash
cd frontend
npm run dev
```

## 🎬 Quick Test Sequence

1. **Create test article** (already done): 1 article with pending status
2. **Login as admin**: http://localhost:5174/admin/login
3. **View pending articles**: Should see "Test Article for Admin Dashboard"
4. **Approve test article**: Click "✓ Approve" button
5. **Create user account**: http://localhost:5174/signup
6. **Submit new article**: http://localhost:5174/news/submit
7. **Check admin dashboard**: Should now see 2 articles (1 approved, 1 pending)
8. **Approve or reject** the new article

## 📝 Current Test Article Details

**Already Created:**
- Title: "Test Article for Admin Dashboard"
- Status: pending
- Approval Status: pending
- Author: admin@planninginsights.com
- Plagiarism Score: 15%
- Category: Technology
- Tags: test, admin, dashboard

**This article should be visible in the admin dashboard NOW!**

---

## 🚀 Next Steps

1. Open admin dashboard and verify you can see the test article
2. Try approving/rejecting the test article
3. Create a user account and submit a new article
4. Check that the new article appears in admin dashboard
5. Test the full approval workflow

If you still don't see articles in the admin panel after following these steps, check the browser console and backend terminal for specific error messages and share them with me.
