# Firebase-MongoDB Activity Tracking System

## Overview
This system automatically syncs Firebase Authentication users with MongoDB Atlas and tracks all user activities in real-time.

## Features

### 1. **Firebase-MongoDB Sync**
- Automatically syncs Firebase users to MongoDB on signup
- Tracks Firebase UID alongside MongoDB user ID
- Bi-directional sync support
- Handles user updates and deletions

### 2. **Real-Time Activity Tracking**
- Tracks all user actions across the platform
- Logs metadata (IP, browser, OS, device, location)
- Stores activity duration and success status
- Supports 40+ activity types

### 3. **Activity Types Tracked**

#### Authentication
- `user_signup` - User registration
- `user_login` - User login
- `user_logout` - User logout
- `password_reset` - Password reset
- `email_verification` - Email verification
- `profile_update` - Profile update

#### Content
- `article_view`, `article_create`, `article_edit`, `article_delete`
- `article_like`, `article_share`

#### Publishing
- `manuscript_submit`, `manuscript_view`, `manuscript_update`, `manuscript_delete`
- `paper_publish`, `paper_download`

#### Forum
- `forum_create`, `forum_view`, `forum_post`, `forum_reply`
- `forum_like`, `forum_follow`

#### Learning
- `course_view`, `course_enroll`, `course_complete`
- `lesson_start`, `lesson_complete`, `quiz_attempt`

#### Jobs
- `job_view`, `job_apply`, `job_save`, `job_share`

#### Networking
- `connection_request`, `connection_accept`, `message_send`
- `group_join`, `event_register`

#### General
- `search_query`, `page_view`, `file_upload`, `file_download`
- `comment_post`, `notification_read`

## Setup

### 1. Environment Variables
Ensure these Firebase credentials are in your `.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Database Models
The system uses two main models:
- **User**: Extended with `firebaseUid` field
- **UserActivity**: New model for tracking activities

## Usage

### Backend Integration

#### 1. Automatic Activity Tracking (Middleware)

Add to any route to automatically track activities:

```javascript
import { trackActivity, trackPageView, trackContentInteraction } from './middleware/activityTracking.js'

// Track specific activity
router.post('/articles', 
  authenticate, 
  trackActivity('article_create'),
  createArticleController
)

// Track content interactions
router.get('/articles/:id',
  authenticate,
  trackContentInteraction('article'),
  getArticleController
)

// Track all page views
app.use(authenticate, trackPageView)
```

#### 2. Manual Activity Logging

```javascript
import ActivityTracker from './services/activityTracker.js'

// Log custom activity
await ActivityTracker.logActivity({
  userId: req.user._id,
  firebaseUid: req.user.firebaseUid,
  activityType: 'custom_action',
  activityData: {
    action: 'custom_data',
    value: 123
  },
  targetResource: {
    resourceType: 'article',
    resourceId: '123',
    resourceTitle: 'Article Title'
  },
  req,
  duration: 5.2,
  success: true
})

// Log authentication
await ActivityTracker.logAuth(userId, 'user_login', req, {
  authMethod: 'firebase',
  provider: 'google'
})

// Log page view
await ActivityTracker.logPageView(userId, '/dashboard', req)

// Log search
await ActivityTracker.logSearch(userId, 'urban planning', filters, results, req)
```

#### 3. Firebase Sync

```javascript
import FirebaseSyncService from './services/firebaseSyncService.js'

// Sync Firebase user on signup
const mongoUser = await FirebaseSyncService.syncFirebaseUserToMongo(firebaseUser, {
  role: 'user',
  provider: 'google'
})

// Get MongoDB user from Firebase token
const mongoUser = await FirebaseSyncService.getMongoUserFromFirebaseToken(idToken)

// Sync all Firebase users (migration)
const result = await FirebaseSyncService.syncAllFirebaseUsers()
// Returns: { syncedCount: 150, errorCount: 2 }
```

### Frontend Integration

#### 1. Track Activities from Frontend

```javascript
// Track activity via API
const trackActivity = async (activityType, activityData) => {
  try {
    await axios.post('/api/activity/log', {
      activityType,
      activityData,
      targetResource: {
        resourceType: 'article',
        resourceId: '123'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  } catch (error) {
    console.error('Failed to track activity:', error)
  }
}

// Usage
trackActivity('article_view', { articleId: '123', timeSpent: 45 })
trackActivity('search_query', { query: 'urban planning', resultsFound: 20 })
```

#### 2. Get User Activity History

```javascript
// Get my activities
const getMyActivities = async () => {
  const response = await axios.get('/api/activity/my-activities?limit=50', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.data.data
}

// Get activity analytics
const getAnalytics = async () => {
  const response = await axios.get('/api/activity/analytics?days=30', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  return response.data.data
}
```

#### 3. Firebase Sync from Frontend

```javascript
import { getAuth } from 'firebase/auth'

// After Firebase authentication
const auth = getAuth()
const user = auth.currentUser

if (user) {
  const idToken = await user.getIdToken()
  
  // Sync with MongoDB
  const response = await axios.post('/api/activity/firebase/sync', {
    idToken
  })
  
  console.log('User synced:', response.data.data.userId)
}
```

## API Endpoints

### Activity Tracking
- `POST /api/activity/log` - Manually log activity
- `GET /api/activity/my-activities` - Get current user's activities
- `GET /api/activity/analytics` - Get activity analytics
- `GET /api/activity/user/:userId` - Get user activities (Admin only)

### Firebase Sync
- `POST /api/activity/firebase/sync` - Sync Firebase user
- `POST /api/activity/firebase/sync-all` - Sync all Firebase users (Admin)

### Maintenance
- `POST /api/activity/cleanup` - Clean up old activities (Admin)

## Query Parameters

### Get Activities
```
GET /api/activity/my-activities?activityType=article_view&startDate=2026-01-01&endDate=2026-01-31&limit=100&skip=0
```

### Get Analytics
```
GET /api/activity/analytics?days=30
```

## Activity Data Structure

```javascript
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f191e810c19729de860ea",
  "firebaseUid": "firebase-uid-123",
  "activityType": "article_view",
  "activityData": {
    "articleId": "123",
    "category": "urban-planning",
    "timeSpent": 45
  },
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "browser": "Chrome 120",
    "os": "Windows 10",
    "device": "desktop",
    "location": {
      "country": "India",
      "city": "Mumbai"
    },
    "referrer": "https://google.com",
    "sessionId": "session-123"
  },
  "targetResource": {
    "resourceType": "article",
    "resourceId": "123",
    "resourceTitle": "Urban Planning Guide"
  },
  "duration": 45.5,
  "success": true,
  "timestamp": "2026-01-20T10:30:00.000Z",
  "createdAt": "2026-01-20T10:30:00.000Z",
  "updatedAt": "2026-01-20T10:30:00.000Z"
}
```

## Example: Track User Journey

```javascript
// 1. User signs up with Firebase
const firebaseUser = await createUserWithEmailAndPassword(auth, email, password)
await FirebaseSyncService.syncFirebaseUserToMongo(firebaseUser)

// 2. User logs in
await ActivityTracker.logAuth(userId, 'user_login', req)

// 3. User views article
await ActivityTracker.logContentInteraction(userId, 'article_view', 'article', articleId, req)

// 4. User searches
await ActivityTracker.logSearch(userId, 'sustainability', {}, results, req)

// 5. User applies for job
await ActivityTracker.logContentInteraction(userId, 'job_apply', 'job', jobId, req)

// 6. User logs out
await ActivityTracker.logAuth(userId, 'user_logout', req)
```

## Analytics Examples

### Get Most Active Users
```javascript
const topUsers = await UserActivity.aggregate([
  {
    $group: {
      _id: '$userId',
      activityCount: { $sum: 1 },
      lastActivity: { $max: '$timestamp' }
    }
  },
  { $sort: { activityCount: -1 } },
  { $limit: 10 }
])
```

### Get Popular Content
```javascript
const popular = await UserActivity.aggregate([
  {
    $match: {
      activityType: 'article_view',
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  },
  {
    $group: {
      _id: '$targetResource.resourceId',
      views: { $sum: 1 },
      title: { $first: '$targetResource.resourceTitle' }
    }
  },
  { $sort: { views: -1 } },
  { $limit: 10 }
])
```

### Get User Activity Timeline
```javascript
const timeline = await ActivityTracker.getUserActivities(userId, {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  limit: 1000
})
```

## Best Practices

1. **Don't block main flow**: Activity tracking runs asynchronously
2. **Set appropriate TTL**: Configure data retention policy
3. **Index properly**: Indexes already created for common queries
4. **Monitor storage**: Activities can grow quickly - monitor MongoDB size
5. **Privacy compliance**: Ensure compliance with GDPR/data privacy laws
6. **Error handling**: Tracking failures don't break main functionality

## Maintenance

### Clean Up Old Data
```javascript
// Delete activities older than 90 days
await ActivityTracker.cleanupOldActivities(90)
```

### Monitor Storage
```bash
# Check collection size in MongoDB
db.useractivities.stats()
```

## Security Notes

- All activity endpoints require authentication
- Admin-only endpoints protected with `requireAdmin` middleware
- User activities isolated by userId
- Sensitive data (passwords) never logged
- IP addresses and metadata can be optionally disabled

## Performance

- Activities logged asynchronously (non-blocking)
- Indexed fields for fast queries
- Supports millions of activities
- Optional TTL for automatic cleanup
- Efficient aggregation queries

## Troubleshooting

### Activity not logging
1. Check authentication middleware
2. Verify userId is present
3. Check MongoDB connection
4. Review server logs

### Firebase sync failing
1. Verify Firebase credentials in .env
2. Check Firebase Admin initialization
3. Ensure Firebase token is valid
4. Review firebaseAdmin.js logs
