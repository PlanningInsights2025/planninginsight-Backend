# Plagiarism Detection System - Implementation Guide

## Overview
The Planning Insights platform now includes a comprehensive plagiarism detection system that helps ensure content originality for all submitted articles. The system supports multiple plagiarism detection providers and provides detailed reports to both users and administrators.

## Features Implemented

### 1. Backend Plagiarism Service
**Location:** `backend/src/services/plagiarism/plagiarismService.js`

**Supported Providers:**
- **Mock Provider** (Development/Testing) - Default
- **Copyscape** - Web content plagiarism detection
- **Quetext** - Academic and general content checking

**Key Functions:**
- `checkPlagiarism(content, title)` - Main plagiarism checking function
- `generateReport(checkResult)` - Creates detailed plagiarism reports
- `getRecommendation(score)` - Provides actionable recommendations based on score
- HTML stripping and word counting utilities

**Score Interpretation:**
- **0-10%**: Excellent - Highly original content
- **10-20%**: Good - Minor similarities, acceptable
- **20-30%**: Moderate - Review recommended
- **30%+**: High - Significant revisions required

### 2. API Endpoints
**Location:** `backend/src/routes/newsroom/plagiarismRoutes.js`

**Available Endpoints:**

#### POST /api/newsroom/plagiarism/check
Check content for plagiarism (authenticated users)

**Request Body:**
```json
{
  "content": "<p>Article content here...</p>",
  "title": "Article Title (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plagiarism check completed successfully",
  "data": {
    "checked": true,
    "score": 15,
    "wordCount": 500,
    "matchedSources": [
      {
        "url": "https://example.com/article",
        "title": "Similar Article",
        "matchPercentage": 12,
        "matchedWords": 60
      }
    ],
    "checkedAt": "2026-01-01T...",
    "provider": "Mock (Development)",
    "recommendation": {
      "status": "good",
      "message": "Good! Minor similarities detected...",
      "action": "ready_to_publish"
    },
    "summary": {
      "originalityScore": 85,
      "plagiarismScore": 15,
      "totalSources": 1,
      "status": "good"
    }
  }
}
```

#### GET /api/newsroom/plagiarism/history
Get plagiarism check history for current user (authenticated)

#### GET /api/newsroom/plagiarism/stats
Get plagiarism statistics for admin dashboard (admin only)

### 3. Frontend Integration
**Location:** `frontend/src/components/newsroom/ArticleSubmission/ArticleSubmissionEnhanced.jsx`

**Features:**
- Real-time plagiarism checking with "Check Plagiarism" button
- Visual progress indicator during check
- Detailed score display with color coding
- Recommendation messages
- Matched sources list (when available)

**API Service:**
`frontend/src/services/api/newsroom.js` includes:
- `checkPlagiarism(content, title)` - Call plagiarism API
- `getPlagiarismHistory()` - Get user's check history
- `getPlagiarismStats()` - Get admin statistics

### 4. Article Submission Flow
1. User writes article content
2. User clicks "Check Plagiarism" button
3. System analyzes content and returns score
4. User reviews score and recommendations
5. User can edit and re-check if needed
6. Article submission includes plagiarism report
7. Admin reviews article with plagiarism data

## Configuration

### Environment Variables
Add these to `backend/.env`:

```env
# Plagiarism Provider ('mock', 'copyscape', 'quetext')
PLAGIARISM_PROVIDER=mock

# Copyscape Configuration
COPYSCAPE_USERNAME=your_username
COPYSCAPE_API_KEY=your_api_key

# Quetext Configuration
QUETEXT_API_KEY=your_api_key

# Thresholds (optional)
PLAGIARISM_ACCEPTABLE_THRESHOLD=30
```

### Using Mock Provider (Development)
The mock provider is enabled by default and requires no API keys. It:
- Simulates real API delay (1.5 seconds)
- Generates random scores between 5-30%
- Creates mock matched sources for testing
- Perfect for development and testing

### Switching to Real Providers

#### Option 1: Copyscape
1. Sign up at https://www.copyscape.com/apiconfigure.php
2. Get your username and API key
3. Update `.env`:
   ```env
   PLAGIARISM_PROVIDER=copyscape
   COPYSCAPE_USERNAME=your_username
   COPYSCAPE_API_KEY=your_api_key
   ```
4. Restart backend server

**Pricing:** Pay-per-use, typically $0.03-$0.05 per search

#### Option 2: Quetext
1. Sign up at https://www.quetext.com/api
2. Get your API key
3. Update `.env`:
   ```env
   PLAGIARISM_PROVIDER=quetext
   QUETEXT_API_KEY=your_api_key
   ```
4. Restart backend server

**Pricing:** Subscription-based, starting at $9.99/month

## Testing the System

### 1. Test Article Submission with Plagiarism Check
1. Login as regular user
2. Navigate to `/news/submit`
3. Write article content (at least 200 characters)
4. Click "Check Plagiarism" button
5. Wait for results (1.5 seconds with mock provider)
6. Review score and recommendations
7. Submit article

### 2. Test Admin Plagiarism Statistics
1. Login as admin
2. Navigate to admin dashboard
3. View plagiarism statistics:
   - Total checks performed
   - High/moderate/low plagiarism counts
   - Acceptance rate
   - Recent checks

### 3. Test API Endpoints (Postman/cURL)

**Check Plagiarism:**
```bash
curl -X POST http://localhost:3000/api/newsroom/plagiarism/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "content": "<p>Your article content here. This should be at least 100 characters long to pass validation. Add more content to test the plagiarism checking system properly.</p>",
    "title": "Test Article Title"
  }'
```

**Get History:**
```bash
curl -X GET http://localhost:3000/api/newsroom/plagiarism/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Stats (Admin):**
```bash
curl -X GET http://localhost:3000/api/newsroom/plagiarism/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Database Schema

### Article Model Updates
The `Article` model includes plagiarism data:

```javascript
{
  plagiarismScore: Number,
  plagiarismReport: {
    checked: Boolean,
    score: Number,
    wordCount: Number,
    matchedSources: [{
      url: String,
      title: String,
      matchPercentage: Number,
      matchedWords: Number,
      textSnippet: String
    }],
    checkedAt: Date,
    provider: String,
    recommendation: Object
  }
}
```

## Admin Moderation Workflow

### Viewing Plagiarism Reports
1. Admin accesses pending articles
2. Each article shows:
   - Plagiarism score
   - Recommendation status
   - Matched sources (if any)
   - Check timestamp
3. Admin can:
   - Approve low-plagiarism content (<30%)
   - Request modifications for moderate plagiarism
   - Reject high-plagiarism content (>30%)

### Plagiarism Statistics Dashboard
- **Total Checks**: Number of plagiarism checks performed
- **High Plagiarism**: Articles with >30% score
- **Moderate Plagiarism**: Articles with 20-30% score
- **Low Plagiarism**: Articles with <20% score
- **Acceptance Rate**: Percentage of acceptable content

## Best Practices

### For Users
1. **Write original content**: Paraphrase ideas in your own words
2. **Cite sources**: Use proper citations for referenced material
3. **Check early**: Run plagiarism check before final submission
4. **Revise if needed**: Address any high-scoring sections
5. **Recheck after edits**: Verify improvements after revisions

### For Administrators
1. **Set clear policies**: Define acceptable plagiarism thresholds
2. **Review reports carefully**: Check matched sources for false positives
3. **Provide feedback**: Help users understand and improve content
4. **Monitor trends**: Track plagiarism statistics over time
5. **Update guidelines**: Refine policies based on data

### For Developers
1. **Use mock provider in development**: Avoid API costs during testing
2. **Rate limiting**: Implement rate limits to prevent abuse
3. **Caching**: Consider caching results for unchanged content
4. **Error handling**: Provide clear error messages to users
5. **Provider fallback**: Implement fallback if primary provider fails

## Extending the System

### Adding New Providers
To add a new plagiarism detection service:

1. Add provider credentials to `.env`
2. Create new method in `plagiarismService.js`:
   ```javascript
   async checkWithNewProvider(content, title) {
     // Implement API integration
     // Return standardized format
   }
   ```
3. Add case to switch statement in `checkPlagiarism()`
4. Update configuration examples

### Custom Thresholds
Modify thresholds in `getRecommendation()` method:
```javascript
if (score < YOUR_THRESHOLD) {
  return { status: 'excellent', ... };
}
```

### Integration with Other Systems
- **Email notifications**: Alert users when check completes
- **Workflow automation**: Auto-reject articles exceeding threshold
- **Analytics**: Track plagiarism trends by category/author
- **Reporting**: Generate periodic plagiarism reports

## Troubleshooting

### Common Issues

**1. "Plagiarism check failed" Error**
- Check backend server is running
- Verify authentication token is valid
- Ensure content is at least 100 characters
- Check backend logs for detailed error

**2. "Provider not configured" Error**
- Verify `PLAGIARISM_PROVIDER` in `.env`
- Check API keys are correct
- Restart backend after .env changes

**3. Slow Response Times**
- Mock provider: 1.5 second delay is normal
- Real providers: Network latency varies
- Consider implementing loading states

**4. False Positives**
- Common phrases may trigger matches
- Technical terms often show similarities
- Review matched sources manually

## API Rate Limits

### Recommended Limits
- **Per User**: 10 checks per day
- **Per Article**: 5 checks per article
- **Global**: 1000 checks per day

### Implementation
Add rate limiting middleware:
```javascript
import rateLimit from 'express-rate-limit';

const plagiarismLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 requests per day
  message: 'Too many plagiarism checks, please try again tomorrow'
});

router.post('/check', authenticate, plagiarismLimiter, checkPlagiarism);
```

## Future Enhancements

### Planned Features
- [ ] Real-time plagiarism checking as user types
- [ ] Citation suggestion tool
- [ ] Plagiarism heat map highlighting matched text
- [ ] Batch checking for multiple articles
- [ ] Plagiarism trends analytics dashboard
- [ ] Integration with Grammarly and Turnitin
- [ ] Automated source citation generation
- [ ] Mobile app support

### Experimental Features
- AI-powered paraphrasing suggestions
- Peer comparison within platform
- Content originality scoring over time
- Automated plagiarism report PDFs

## Support & Resources

### Documentation
- Copyscape API Docs: https://www.copyscape.com/apidoc.php
- Quetext API Docs: https://www.quetext.com/api/documentation
- Express Rate Limit: https://www.npmjs.com/package/express-rate-limit

### Contact
For technical support or questions:
- Email: support@planninginsights.com
- GitHub Issues: [repository-url]/issues
- Documentation: https://docs.planninginsights.com

## License & Credits

This plagiarism detection system is part of the Planning Insights platform.
- Built with Node.js, Express, and React
- Supports multiple third-party plagiarism APIs
- Developed for the built environment professional community

---

**Last Updated:** January 1, 2026
**Version:** 1.0.0
**Status:** Production Ready (with mock provider)
