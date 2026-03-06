# Newsroom Portal - Implementation Summary

## Completed Changes

### 1. Enhanced Article Model ✅
Location: `backend/src/models/Article.js`

**New Fields Added:**
- `wordCount` - Track article word count
- `mediaFiles[]` - Support for videos, images, documents
- `coAuthors[]` - Co-author system with email invites and status tracking
- `likes[]` & `dislikes[]` - Like/dislike functionality
- `likesCount` & `dislikesCount` - Denormalized counts for performance
- `comments[]` - Embedded comments with likes
- `flags[]` - Content flagging system with status tracking
- `subscriptionOnly` & `isPremium` - Access control for premium content
- `citationText` & `doi` - Citation and reference system
- `modificationNotes` - Admin can request modifications
- `shareCount` - Track social sharing
- `eventId` - Link articles to special events/contests
- `isContestEntry` - Flag contest submissions
- `preventCopy` & `preventScreenshot` - Content protection flags
- `approvalStatus` enum updated to include 'needsModification'

### 2. Created NewsroomEvent Model ✅
Location: `backend/src/models/NewsroomEvent.js`

**Features:**
- Contest and special issue management
- Word limits, themes, submission rules
- Prize configuration
- Judge assignment
- Sponsor management
- Participant tracking
- Winner declaration system

### 3. Enhanced Article Controller ✅
Location: `backend/src/controllers/newsroom/articleController.js`

**New Endpoints:**
- `POST /articles/:id/like` - Like an article
- `POST /articles/:id/dislike` - Dislike an article
- `POST /articles/:id/comments` - Add comment
- `DELETE /articles/:id/comments/:commentId` - Delete comment
- `POST /articles/:id/flag` - Flag article for review
- `POST /articles/:id/share` - Track social shares
- `GET /articles/:id/stats` - Get article statistics

### 4. Updated Admin Controller ✅
Location: `backend/src/controllers/admin/adminController.js`

**Enhanced Features:**
- Added 'needsModification' status
- Support for modification notes
- Email notification hooks (TODO: implement email service)

### 5. Updated Routes ✅
Location: `backend/src/routes/newsroom/articleRoutes.js`

All new endpoints added to routing configuration.

---

## Next Steps - Features to Implement

### Priority 1: Article Submission Form Enhancement
**File:** `frontend/src/components/newsroom/ArticleSubmission/ArticleSubmissionEnhanced.jsx`

**Required Features:**
1. **Word Counter** - Real-time word count display
2. **Co-Author Selection**
   - Search users by Planning Insights ID or email
   - Send email invitations to unregistered users
   - Display co-author status (pending/accepted/declined)
3. **File Upload**
   - Support for Word/PDF upload to auto-fill editor
   - Media file uploads (videos in ZIP, images)
4. **Genre/Tag System** - Multiple tags with autocomplete
5. **Preview Mode** - Show formatted article preview before submission
6. **Citation Generator** - Auto-generate citation text

### Priority 2: Article Detail Page with Protected Content
**New File:** `frontend/src/pages/News/ArticleDetail.jsx`

**Required Features:**
1. **Login-Required Access**
   - Show first and last paragraphs only for non-logged users
   - Blur middle content with "Login to read more" overlay
2. **Interaction Features**
   - Like/Dislike buttons
   - Comment section with nested replies
   - Flag content button
   - Social share buttons (Twitter, LinkedIn, Facebook)
3. **Author Section**
   - Author and co-author cards
   - Profile pictures and unique IDs
   - Links to author portfolios
4. **Related Articles** - Based on tags/category
5. **Content Protection**
   - Disable right-click
   - Disable text selection (CSS)
   - Watermark on images
6. **Citation Block** - Display citation at bottom

### Priority 3: Admin Moderation Panel Enhancement
**File:** `frontend/src/pages/Admin/Admin/components/NewsroomManagement.jsx`

**Required Features:**
1. **Three-Button Actions**
   - ✅ Approve
   - ❌ Reject (with reason)
   - 🔄 Request Modification (with notes)
2. **Article Preview** - View full article before decision
3. **Plagiarism Report Display** - Show plagiarism check results
4. **Flag Management** - View and resolve user flags
5. **Bulk Actions** - Approve/reject multiple articles

### Priority 4: Homepage Article Preview
**File:** `frontend/src/pages/Home/Home.jsx`

**Required Features:**
1. **Latest Articles Section**
   - Display 3-5 recent articles
   - Show headline, excerpt, author, date
   - "Read More" button linking to full article
2. **Responsive Grid Layout**
3. **Category Badges**

### Priority 5: Special Events/Contests System
**New Files:**
- `frontend/src/pages/News/NewsroomEvents.jsx`
- `frontend/src/pages/Admin/Admin/components/EventManagement.jsx`
- `backend/src/controllers/newsroom/eventController.js`

**Required Features:**
1. **Admin: Create Event**
   - Set theme, word limits, dates
   - Configure prizes and judging
   - Add sponsors
2. **User: Browse Events**
   - View active contests
   - Submit entry (linked to event)
3. **Admin: Manage Submissions**
   - View all event submissions
   - Declare winners

### Priority 6: Email Notification System
**New File:** `backend/src/services/email/articleNotifications.js`

**Required Notifications:**
- Article submitted → Confirmation to author
- Article approved → Notification to author
- Article rejected → Notification with reason
- Modification requested → Notification with notes
- Co-author invitation → Email to potential co-author
- Comment on article → Notification to author
- Article flagged → Notification to admin

### Priority 7: Plagiarism Check Integration
**Options:**
1. **Copyscape API** (Paid)
2. **Turnitin API** (Paid - Education focused)
3. **Custom similarity check** using:
   - Google Custom Search API
   - Text comparison algorithms
   - Open-source tools like DiffChecker

**Implementation:**
- Add plagiarism check before admin review
- Display similarity percentage
- Show matched sources
- Allow admin override

---

## API Endpoints Summary

### Article Endpoints
```
GET    /api/newsroom/articles/published    - Get published articles (public)
GET    /api/newsroom/articles/:id          - Get article by ID
POST   /api/newsroom/articles              - Create article (auth required)
PUT    /api/newsroom/articles/:id          - Update article
DELETE /api/newsroom/articles/:id          - Delete article
POST   /api/newsroom/articles/:id/like     - Like article
POST   /api/newsroom/articles/:id/dislike  - Dislike article
POST   /api/newsroom/articles/:id/comments - Add comment
DELETE /api/newsroom/articles/:id/comments/:commentId - Delete comment
POST   /api/newsroom/articles/:id/flag     - Flag article
POST   /api/newsroom/articles/:id/share    - Track share
GET    /api/newsroom/articles/:id/stats    - Get statistics
GET    /api/newsroom/my-articles           - Get user's articles
```

### Admin Endpoints
```
GET    /api/admin/articles                         - Get all articles with filters
PATCH  /api/admin/articles/:articleId/status      - Update article status
DELETE /api/admin/articles/:articleId             - Delete article
```

### Event Endpoints (To Be Created)
```
GET    /api/newsroom/events                - Get all events
POST   /api/admin/events                   - Create event (admin)
GET    /api/newsroom/events/:id            - Get event details
PUT    /api/admin/events/:id               - Update event (admin)
POST   /api/newsroom/events/:id/submit     - Submit article to event
```

---

## Database Schema Changes

Run these commands to update existing articles:
```javascript
// Add default values to existing articles
db.articles.updateMany(
  {},
  {
    $set: {
      likesCount: 0,
      dislikesCount: 0,
      shareCount: 0,
      wordCount: 0,
      subscriptionOnly: false,
      isPremium: false,
      preventCopy: true,
      preventScreenshot: true,
      isContestEntry: false
    }
  }
)
```

---

## Frontend Components Needed

### New Components:
1. `ArticleCard.jsx` - Reusable article preview card
2. `ArticleDetail.jsx` - Full article view with interactions
3. `CoAuthorSelector.jsx` - Co-author selection widget
4. `CommentSection.jsx` - Comments UI
5. `ContentProtection.jsx` - HOC for content protection
6. `EventCard.jsx` - Event/contest card
7. `EventSubmission.jsx` - Submit article to event
8. `FlagArticleModal.jsx` - Flag content modal
9. `SocialShareButtons.jsx` - Share buttons component

### Updated Components:
1. `NewsroomManagement.jsx` - Add moderation actions
2. `ArticleSubmissionEnhanced.jsx` - Add all submission features
3. `Home.jsx` - Add article preview section

---

## Testing Checklist

- [ ] Submit article with co-authors
- [ ] Admin approves article
- [ ] Admin rejects article with reason
- [ ] Admin requests modification
- [ ] User views published article
- [ ] Non-logged user sees blurred content
- [ ] Logged user likes/dislikes article
- [ ] User adds comment
- [ ] User flags article
- [ ] Social share tracking works
- [ ] Contest submission and winner selection
- [ ] Email notifications sent

---

## Security Considerations

1. **Content Protection**
   - Implement CSS to prevent text selection
   - Disable right-click context menu
   - Add watermarks to images
   - Monitor for unauthorized scraping

2. **Access Control**
   - Verify user authentication for protected routes
   - Check subscription status for premium content
   - Rate limit API endpoints

3. **Input Validation**
   - Sanitize HTML content from WYSIWYG editor
   - Validate file uploads (size, type)
   - Prevent XSS in comments

4. **Copyright Protection**
   - Store DMCA takedown notices
   - Implement content dispute resolution
   - Track citation compliance

---

## Current Status

✅ **Completed:**
- Article model enhanced
- NewsroomEvent model created
- Backend controllers updated
- API routes configured
- Like/dislike/comment/flag system implemented

🚧 **In Progress:**
- Admin moderation UI
- Email notifications

⏳ **Pending:**
- Article submission form enhancements
- Article detail page
- Homepage preview section
- Event/contest system
- Plagiarism check integration
- Content protection implementation

---

## Quick Start for Testing

1. **Create a test article:**
```bash
cd backend
node src/scripts/createTestArticle.js
```

2. **Check database:**
```bash
node src/scripts/checkArticles.js
```

3. **Start servers:**
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

4. **Admin login:**
- Go to: http://localhost:5175/admin/login
- Use admin credentials
- Navigate to Newsroom section

5. **Test moderation:**
- Set filter to "Pending" status
- Click on article
- Approve/Reject/Request Modification

---

## Next Immediate Actions

1. Update NewsroomManagement component to add "Request Modification" button
2. Create ArticleDetail page with content protection
3. Add word counter to submission form
4. Implement co-author selection
5. Add homepage article preview

Would you like me to implement any specific feature from this list?
