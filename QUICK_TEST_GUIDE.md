# 🚀 Quick Testing Guide - Article Submission & Admin Approval

## ✅ System Status
- **Backend**: Running on `http://localhost:3000` ✅
- **Frontend**: Running on `http://localhost:5175` ✅
- **Database**: MongoDB connected ✅
- **Test Article**: Created with `approvalStatus='pending'` ✅

---

## 📝 Test Article Submission (User Flow)

### Step 1: Login as User
1. Go to: `http://localhost:5175/login`
2. Login with any user account (or create new one)

### Step 2: Submit Article
1. Navigate to: `http://localhost:5175/news/submit`
2. Fill in the form:
   - **Title**: Minimum 10 characters
     - Example: "Sustainable Urban Development Practices"
   
   - **Excerpt**: Minimum 50 characters
     - Example: "Exploring innovative approaches to sustainable city planning and green infrastructure development in modern urban environments"
   
   - **Content**: Minimum 200 characters (use the WYSIWYG editor)
     - Write substantial content about urban planning
   
   - **Category**: Select any category
     - Example: "Urban Planning"
   
   - **Tags**: Add at least 1 tag
     - Example: urban, sustainability, planning
   
   - **Featured Image** (optional): Upload an image

3. **Run Plagiarism Check** (Required)
   - Click "Check Plagiarism" button
   - Wait 3 seconds
   - Should show score < 30%

4. **Submit Article**
   - Click "Submit for Review" button
   - You'll see: "Article submitted successfully! Awaiting admin approval."
   - You'll be redirected to `/news`

### Step 3: Check Console Logs (for debugging)
Press **F12** to open browser console and look for:
```
=== SUBMITTING ARTICLE ===
isDraft: false
FormData: {title, excerpt, ...}
Calling API...
API Response: {success: true, message: "Article submitted successfully!"}
```

---

## 👨‍💼 Test Admin Approval Flow

### Step 1: Login as Admin
1. Go to: `http://localhost:5175/admin/login`
2. Login:
   - **Email**: `admin@planning-insights.com`
   - **Password**: `Admin@123`

### Step 2: View Pending Articles
1. Click **"Newsroom"** in admin sidebar
2. Filter should default to **"Pending"** approval status
3. You should see:
   - Test article: "Test Article for Admin Dashboard"
   - Any user-submitted articles

### Step 3: Approve Article
1. Find the article you want to approve
2. Click **"✓ Approve"** button
3. You'll see: "Article approved and published!"
4. Article disappears from "Pending" filter
5. Change filter to **"Approved"** to see it

### Step 4: View Published Article on Newsroom
1. Go to: `http://localhost:5175/news`
2. The approved article should now appear in the article grid
3. Click on the article card to view full details

---

## 🐛 Troubleshooting

### Issue: "No articles found" in admin panel

**Check Backend Logs**:
```bash
# In backend terminal, look for:
=== ADMIN FETCHING ARTICLES ===
Query params: {page: 1, limit: 20, approvalStatus: 'pending'}
Articles found: 1
```

**Check Database**:
```bash
cd "c:\Users\Lenovo\Desktop\planning insight data\Planning-Insights\backend"
node src/scripts/checkArticles.js
```

Should show:
```
=== PENDING ARTICLES ===
Count: 1 (or more)
```

### Issue: Article submission fails

**Check Browser Console** (F12):
- Look for errors in red
- Check "Network" tab for failed API calls

**Check Backend Terminal**:
- Look for: `=== ARTICLE SUBMISSION RECEIVED ===`
- Check for errors

**Common Issues**:
1. **Not logged in**: Make sure you're authenticated
2. **Form validation**: Check all required fields are filled
3. **Plagiarism check**: Must run plagiarism check before submitting
4. **Backend not running**: Ensure backend server is running on port 3000

### Issue: Approved articles don't appear in newsroom

**Check Article Status**:
```bash
node src/scripts/checkArticles.js
```

Approved articles should have:
- `status: 'published'`
- `approvalStatus: 'approved'`
- `isPublished: true`

**Check Browser Console**:
```
=== LOADING PUBLISHED ARTICLES ===
Loaded X published articles
```

---

## 🔍 Quick Verification Commands

### Check Articles in Database
```bash
cd "c:\Users\Lenovo\Desktop\planning insight data\Planning-Insights\backend"
node src/scripts/checkArticles.js
```

### Create Test Article
```bash
cd "c:\Users\Lenovo\Desktop\planning insight data\Planning-Insights\backend"
node src/scripts/createTestArticle.js
```

### Restart Backend
```bash
cd "c:\Users\Lenovo\Desktop\planning insight data\Planning-Insights\backend"
npm start
```

---

## ✨ Expected Workflow

```
1. User writes article → Fills form with min requirements
2. User checks plagiarism → Score < 30%
3. User submits → Article created with status='pending', approvalStatus='pending'
4. Admin logs in → Goes to Newsroom Management
5. Admin sees pending article → With all details (title, author, category, plagiarism score)
6. Admin approves → Article status changes to published, approvalStatus='approved'
7. Public views newsroom → Approved article appears in article grid
8. User clicks article → Full article content displayed
```

---

## 📊 API Endpoints

### Article Submission (User)
```
POST /api/newsroom/articles
Headers: Authorization: Bearer <token>
Body: FormData with title, excerpt, content, category, tags, isPublished
```

### Get Pending Articles (Admin)
```
GET /api/admin/articles?approvalStatus=pending
Headers: Authorization: Bearer <admin-token>
```

### Approve Article (Admin)
```
PATCH /api/admin/articles/:articleId/status
Headers: Authorization: Bearer <admin-token>
Body: { "approvalStatus": "approved" }
```

### Get Published Articles (Public)
```
GET /api/newsroom/articles/published
No authentication required
```

---

## 🎯 Success Indicators

### ✅ Submission Success
- Toast notification: "Article submitted successfully! Awaiting admin approval."
- Redirect to `/news`
- Article appears in admin panel with "Pending" status

### ✅ Approval Success
- Toast notification: "Article approved and published!"
- Article moves from "Pending" to "Approved" in admin panel
- Article appears on public newsroom page
- Article can be clicked to view full details

---

## 📝 Admin Credentials
```
Email: admin@planning-insights.com
Password: Admin@123
```

---

**Last Updated**: December 31, 2025  
**System Status**: ✅ Fully Operational  
**Test Article**: ✅ Created and Ready for Testing
