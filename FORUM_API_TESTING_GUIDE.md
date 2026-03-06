# Discussion Forum - Backend API Testing Guide

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in headers:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. FORUM OPERATIONS

### 1.1 Create Forum
**POST** `/forum/create`
**Auth:** Required

```json
{
  "title": "Sustainable Urban Development",
  "description": "Discuss sustainable practices in urban planning and development"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Forum created successfully and is pending approval",
  "data": {
    "_id": "...",
    "title": "Sustainable Urban Development",
    "slug": "sustainable-urban-development",
    "status": "pending",
    ...
  }
}
```

### 1.2 Get All Forums
**GET** `/forum/list`
**Auth:** Optional

**Query Parameters:**
- `status` (optional): approved | pending | rejected
- `sortBy` (optional): trending | newest | popular | active
- `following` (optional): true (shows only followed forums)
- `createdBy` (optional): userId

**Example:**
```
GET /forum/list?status=approved&sortBy=trending
```

### 1.3 Get Single Forum
**GET** `/forum/:id`
**Auth:** Optional

```
GET /forum/6789abcd1234567890abcdef
```

### 1.4 Get Forum Suggestions (Duplicate Detection)
**GET** `/forum/suggestions`
**Auth:** Optional

**Query Parameters:**
- `query` (required): Search text

```
GET /forum/suggestions?query=sustainable
```

### 1.5 Check Title Uniqueness
**GET** `/forum/check-title/:title`
**Auth:** Optional

```
GET /forum/check-title/Sustainable%20Urban%20Development
```

### 1.6 Follow/Unfollow Forum
**POST** `/forum/:forumId/follow`
**Auth:** Required

```
POST /forum/6789abcd1234567890abcdef/follow
```

### 1.7 Get Trending Forums
**GET** `/forum/trending`
**Auth:** Optional

**Query Parameters:**
- `limit` (optional): Number of forums (default: 10)

```
GET /forum/trending?limit=5
```

### 1.8 Get Forum Analytics
**GET** `/forum/:forumId/analytics`
**Auth:** Optional

```
GET /forum/6789abcd1234567890abcdef/analytics
```

---

## 2. QUESTION OPERATIONS

### 2.1 Create Question
**POST** `/forum/:forumId/question`
**Auth:** Required

```json
{
  "title": "What are the best practices for green building design?",
  "content": "I'm working on a new residential project and want to incorporate sustainable features...",
  "isAnonymous": false
}
```

### 2.2 Get Questions for Forum
**GET** `/forum/:forumId/questions`
**Auth:** Optional

**Query Parameters:**
- `sortBy`: newest | popular | unanswered
- `page`: Page number
- `limit`: Items per page

```
GET /forum/6789abcd1234567890abcdef/questions?sortBy=popular&page=1&limit=20
```

### 2.3 Get Single Question
**GET** `/forum/question/:questionId`
**Auth:** Optional

```
GET /forum/question/6789abcd1234567890abcdef
```

### 2.4 Get Question Suggestions (Duplicate Detection)
**GET** `/forum/question/suggestions`
**Auth:** Optional

**Query Parameters:**
- `query` (required): Search text
- `forumId` (optional): Limit to specific forum

```
GET /forum/question/suggestions?query=green%20building&forumId=6789abcd1234567890abcdef
```

### 2.5 React to Question (Like/Dislike)
**POST** `/forum/question/:questionId/react`
**Auth:** Required

```json
{
  "type": "like"  // or "dislike"
}
```

### 2.6 Follow/Unfollow Question
**POST** `/forum/question/:questionId/follow`
**Auth:** Required

```
POST /forum/question/6789abcd1234567890abcdef/follow
```

### 2.7 Delete Question
**DELETE** `/forum/question/:questionId`
**Auth:** Required (Owner only)

```
DELETE /forum/question/6789abcd1234567890abcdef
```

---

## 3. ANSWER OPERATIONS

### 3.1 Create Answer
**POST** `/forum/question/:questionId/answer`
**Auth:** Required

```json
{
  "content": "Green building design should focus on...",
  "isAnonymous": false
}
```

### 3.2 Get Answers for Question
**GET** `/forum/question/:questionId/answers`
**Auth:** Optional

**Query Parameters:**
- `sortBy`: newest | popular | best
- `page`: Page number
- `limit`: Items per page

```
GET /forum/question/6789abcd1234567890abcdef/answers?sortBy=popular
```

### 3.3 Add Comment to Answer
**POST** `/forum/answer/:answerId/comment`
**Auth:** Required

```json
{
  "content": "Great insights! I would also add..."
}
```

### 3.4 React to Answer
**POST** `/forum/answer/:answerId/react`
**Auth:** Required

```json
{
  "type": "like"  // or "dislike"
}
```

### 3.5 Mark as Best Answer
**PUT** `/forum/answer/:answerId/mark-best`
**Auth:** Required (Question author only)

```
PUT /forum/answer/6789abcd1234567890abcdef/mark-best
```

### 3.6 Delete Answer
**DELETE** `/forum/answer/:answerId`
**Auth:** Required (Owner only)

```
DELETE /forum/answer/6789abcd1234567890abcdef
```

### 3.7 React to Comment
**POST** `/forum/answer/:answerId/comment/:commentId/react`
**Auth:** Required

```
POST /forum/answer/6789abcd1234567890abcdef/comment/6789abcd1234567890fedcba/react
```

---

## 4. MODERATION

### 4.1 Flag Content
**POST** `/forum/flag`
**Auth:** Required

```json
{
  "contentType": "question",  // or "answer", "forum"
  "contentId": "6789abcd1234567890abcdef",
  "reason": "spam",  // spam | harassment | inappropriate | misinformation | other
  "additionalDetails": "This post contains promotional content"
}
```

### 4.2 Submit Appeal
**POST** `/forum/appeal/flag/:flagId/appeal`
**Auth:** Required

```json
{
  "content": "I believe this content was flagged incorrectly because..."
}
```

---

## 5. POLL OPERATIONS

### 5.1 Get All Polls
**GET** `/forum/polls`
**Auth:** Optional

**Query Parameters:**
- `status`: active | closed
- `forumId`: Filter by forum
- `pinned`: true | false

```
GET /forum/polls?status=active&pinned=true
```

### 5.2 Get Single Poll
**GET** `/forum/poll/:pollId`
**Auth:** Optional

```
GET /forum/poll/6789abcd1234567890abcdef
```

### 5.3 Vote on Poll
**POST** `/forum/poll/:pollId/vote`
**Auth:** Required

```json
{
  "optionIndexes": [0, 2]  // Can vote for multiple options if allowed
}
```

---

## 6. ADMIN OPERATIONS

### 6.1 Get Pending Forums
**GET** `/admin/forum/forums/pending`
**Auth:** Admin Required

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page

```
GET /admin/forum/forums/pending?page=1&limit=10
```

### 6.2 Get All Forums (Admin View)
**GET** `/admin/forum/forums`
**Auth:** Admin Required

```
GET /admin/forum/forums
```

### 6.3 Approve Forum
**PUT** `/admin/forum/forum/:forumId/approve`
**Auth:** Admin Required

```
PUT /admin/forum/forum/6789abcd1234567890abcdef/approve
```

### 6.4 Reject Forum
**PUT** `/admin/forum/forum/:forumId/reject`
**Auth:** Admin Required

```json
{
  "reason": "This topic is too specific and would be better suited in an existing forum"
}
```

### 6.5 Get Flagged Content
**GET** `/admin/forum/flags`
**Auth:** Admin Required

**Query Parameters:**
- `status`: pending | resolved | appealed
- `contentType`: forum | question | answer
- `priority`: low | medium | high

```
GET /admin/forum/flags?status=pending&priority=high
```

### 6.6 Get Anonymous Identity
**GET** `/admin/forum/flag/:contentType/:contentId/identity`
**Auth:** Admin Required

```
GET /admin/forum/flag/question/6789abcd1234567890abcdef/identity
```

### 6.7 Resolve Flag
**POST** `/admin/forum/flag/:flagId/resolve`
**Auth:** Admin Required

```json
{
  "action": "remove",  // remove | dismiss
  "adminNotes": "Content violates community guidelines"
}
```

### 6.8 Review Appeal
**POST** `/admin/forum/flag/:flagId/appeal/review`
**Auth:** Admin Required

```json
{
  "decision": "uphold",  // uphold | overturn
  "adminNotes": "After review, the original decision stands"
}
```

### 6.9 Create Poll (Admin)
**POST** `/admin/forum/poll/create`
**Auth:** Admin Required

```json
{
  "question": "What urban planning topic interests you most?",
  "options": [
    "Sustainable Development",
    "Transportation Planning",
    "Housing Policy",
    "Public Spaces"
  ],
  "allowMultipleVotes": false,
  "forumId": "6789abcd1234567890abcdef",  // optional
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "isPinned": true,
  "collaboratorType": "government",  // optional: government | ngo
  "collaboratorName": "Ministry of Urban Development",  // optional
  "collaboratorLogo": "https://example.com/logo.png"  // optional
}
```

### 6.10 Get Poll Analytics
**GET** `/admin/forum/poll/:pollId/analytics`
**Auth:** Admin Required

```
GET /admin/forum/poll/6789abcd1234567890abcdef/analytics
```

### 6.11 Close Poll
**PUT** `/admin/forum/poll/:pollId/close`
**Auth:** Admin Required

```
PUT /admin/forum/poll/6789abcd1234567890abcdef/close
```

---

## Testing Workflow

### Step 1: Authentication
1. Login as regular user: `POST /auth/login`
2. Login as admin: `POST /auth/login` (use admin credentials)
3. Save both tokens for subsequent requests

### Step 2: Forum Creation & Approval
1. Create forum as user (pending status)
2. Get pending forums as admin
3. Approve forum as admin
4. Verify forum appears in public list

### Step 3: Question & Answer Flow
1. Create question in approved forum
2. Test duplicate detection with similar question
3. Create multiple answers
4. Add comments to answers
5. React to questions/answers/comments
6. Mark best answer

### Step 4: Anonymous Posting
1. Create anonymous question
2. Create anonymous answer
3. Verify user identity is masked in public response
4. As admin, reveal anonymous identity

### Step 5: Moderation Flow
1. Flag inappropriate content
2. View flags as admin
3. Resolve flag (remove or dismiss)
4. Submit appeal as user
5. Review appeal as admin

### Step 6: Poll System
1. Create poll as admin
2. Vote on poll as user
3. Get poll analytics as admin
4. Close poll as admin

### Step 7: Follow System
1. Follow forum
2. Follow question
3. Verify notifications sent to followers when:
   - New question in followed forum
   - New answer to followed question
   - Best answer marked on followed question

---

## Error Response Format

All errors follow this structure:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

---

## Notes

1. **Anonymous Posting**: When `isAnonymous: true`, user details are replaced with:
   - `username`: "Anonymous User"
   - `_id`: Hashed identifier (consistent per user per forum)

2. **Email Notifications**: Sent for:
   - Forum approval/rejection
   - New questions in followed forums
   - New answers to followed questions
   - Flag resolutions
   - Appeal decisions

3. **Appeal System**: 
   - 3-day window from flag resolution
   - Only one appeal per flag
   - Admin decision is final

4. **Trending Calculation**: Based on:
   - Recent activity (questions, answers)
   - View count
   - Follower count
   - Time decay factor

5. **Rate Limiting**: Consider implementing rate limits for:
   - Forum creation (1 per hour)
   - Question posting (5 per hour)
   - Flagging (10 per day)
