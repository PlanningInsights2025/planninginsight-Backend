# Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Planning Insights Application                │
└─────────────────────────────────────────────────────────────────┘

                              User Browser
                                   │
                                   │
                   ┌───────────────┴───────────────┐
                   │                               │
                   ▼                               ▼
         ┌──────────────────┐           ┌──────────────────┐
         │   FRONTEND       │           │   FRONTEND       │
         │   (Netlify)      │           │   (Local Dev)    │
         │                  │           │                  │
         │  - React + Vite  │           │  localhost:5173  │
         │  - Static Files  │           │                  │
         └────────┬─────────┘           └────────┬─────────┘
                  │                              │
                  │ VITE_API_URL                 │
                  │                              │
         ┌────────▼──────────────────────────────▼─────────┐
         │                                                  │
         │              API Requests (HTTPS)                │
         │                                                  │
         └────────┬─────────────────────────────┬──────────┘
                  │                             │
                  ▼                             ▼
         ┌──────────────────┐         ┌──────────────────┐
         │   BACKEND        │         │   BACKEND        │
         │   (Vercel)       │         │   (Local Dev)    │
         │                  │         │                  │
         │  - Node.js       │         │  localhost:3000  │
         │  - Express       │         │                  │
         │  - Serverless    │         │                  │
         └────────┬─────────┘         └────────┬─────────┘
                  │                            │
                  │                            │
         ┌────────┴────────────────────────────┴─────────┐
         │                                                │
         │           External Services & Database         │
         │                                                │
         └────────┬──────────┬──────────┬─────────────────┘
                  │          │          │
                  ▼          ▼          ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │ MongoDB  │ │ Firebase │ │  SMTP    │
         │  Atlas   │ │   Auth   │ │ (Gmail)  │
         │          │ │          │ │          │
         │  Cloud   │ │  Cloud   │ │  Cloud   │
         │ Database │ │  Auth    │ │  Email   │
         └──────────┘ └──────────┘ └──────────┘
```

---

## Deployment Flow

### 🔵 Production Flow (After Deployment)

```
1. User visits Netlify URL (https://your-app.netlify.app)
2. Netlify serves static React files
3. Frontend makes API calls to Vercel (https://your-api.vercel.app)
4. Vercel serverless functions process requests
5. Backend connects to MongoDB Atlas (cloud)
6. Backend authenticates with Firebase (cloud)
7. Backend sends emails via SMTP (Gmail)
8. Response flows back to user
```

### 🟢 Development Flow (Current)

```
1. User visits localhost:5173
2. Vite dev server serves React files
3. Frontend makes API calls to localhost:3000
4. Express server processes requests
5. Backend connects to local/Atlas MongoDB
6. Backend authenticates with Firebase
7. Backend sends emails via SMTP
8. Response flows back to user
```

---

## Platform Responsibilities

### Netlify (Frontend Hosting)
- ✅ Serves static HTML, CSS, JavaScript
- ✅ Global CDN (fast worldwide)
- ✅ Automatic HTTPS
- ✅ Instant deployments
- ✅ Automatic builds from GitHub
- ✅ Client-side routing (SPA)
- ❌ No server-side code execution

### Vercel (Backend Hosting)
- ✅ Runs Node.js serverless functions
- ✅ Automatic HTTPS
- ✅ Automatic scaling
- ✅ API endpoints
- ✅ Database connections
- ✅ Automatic builds from GitHub
- ❌ Limited to serverless (no long-running processes)

### MongoDB Atlas (Database)
- ✅ Cloud-hosted MongoDB
- ✅ Automatic backups
- ✅ Free tier available (M0)
- ✅ Global accessibility
- ✅ Automatic scaling
- ✅ Security & encryption

---

## Data Flow Example

### User Registration Flow

```
┌──────────┐
│  User    │
│  Browser │
└────┬─────┘
     │ 1. Fill registration form
     ▼
┌──────────────┐
│   Netlify    │ (React Frontend)
│   Frontend   │
└────┬─────────┘
     │ 2. POST /api/auth/register
     │    with user data
     ▼
┌──────────────┐
│   Vercel     │ (Express Backend)
│   Backend    │
└────┬─────────┘
     │ 3. Validate data
     │ 4. Hash password (bcrypt)
     ▼
┌──────────────┐
│  MongoDB     │ (Database)
│   Atlas      │
└────┬─────────┘
     │ 5. Store user record
     ▼
┌──────────────┐
│   Vercel     │
│   Backend    │
└────┬─────────┘
     │ 6. Send welcome email
     ▼
┌──────────────┐
│    SMTP      │ (Gmail)
│   Service    │
└──────────────┘
     │ 7. Return success response
     ▼
┌──────────────┐
│   Netlify    │
│   Frontend   │
└────┬─────────┘
     │ 8. Show success message
     ▼
┌──────────┐
│  User    │
│  Browser │
└──────────┘
```

---

## Environment Variables Flow

### Frontend (Netlify)
```
Build Time:
VITE_API_URL → Embedded in JavaScript bundle → Sent to browser

Runtime:
User browser uses embedded API URL for all backend calls
```

### Backend (Vercel)
```
Runtime:
Environment variables → Serverless function → Used for:
- Database connection (MONGODB_URI)
- JWT signing (JWT_SECRET)
- CORS validation (FRONTEND_URL)
- Email sending (SMTP_*)
- Firebase auth (FIREBASE_*)
```

---

## Security Layers

```
┌─────────────────────────────────────────────┐
│          Internet (Public Access)            │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│        HTTPS Encryption (Both Platforms)     │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│        CORS Protection (Backend)             │
│   Only allows requests from frontend URL    │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│        JWT Authentication (Backend)          │
│   Validates user tokens on each request     │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│      MongoDB Atlas Authentication            │
│   Username/password + network whitelist     │
└─────────────────────────────────────────────┘
```

---

## Deployment Pipeline

### Automated Deployment Flow

```
Developer                GitHub              Netlify/Vercel
    │                       │                       │
    │ 1. git push           │                       │
    ├──────────────────────►│                       │
    │                       │ 2. Webhook triggers   │
    │                       │       build           │
    │                       ├──────────────────────►│
    │                       │                       │
    │                       │   3. Build process:   │
    │                       │   - npm install       │
    │                       │   - npm run build     │
    │                       │   - Run tests         │
    │                       │                       │
    │                       │   4. Deploy           │
    │                       │   - Upload files      │
    │                       │   - Update DNS        │
    │                       │   - Invalidate cache  │
    │                       │                       │
    │                       │ 5. Deployment success │
    │                       ◄───────────────────────│
    │ 6. Notification       │                       │
    ◄───────────────────────┤                       │
    │                       │                       │
```

---

## Cost Breakdown (Estimated)

### Free Tier Usage

| Service | Free Tier | Typical Usage | Cost |
|---------|-----------|---------------|------|
| Netlify | 100GB bandwidth/mo | ~10GB | $0 |
| Vercel | 100GB bandwidth/mo | ~5GB | $0 |
| MongoDB Atlas | 512MB storage | ~200MB | $0 |
| Firebase | 50K daily reads | ~5K | $0 |
| Gmail SMTP | 500 emails/day | ~50 | $0 |
| **Total** | | | **$0/month** |

### Scaling Considerations

- **Small app** (< 1000 users): Free tier sufficient
- **Medium app** (1000-10000 users): ~$20-50/month
- **Large app** (> 10000 users): Need paid plans

---

## Monitoring & Logs

### Where to Find Logs

```
Frontend Issues:
├── Browser Console (F12)
└── Netlify Deploy Logs

Backend Issues:
├── Vercel Function Logs
└── MongoDB Atlas Monitoring

Performance:
├── Netlify Analytics
├── Vercel Analytics
└── Browser DevTools
```

---

## Rollback Strategy

### If Deployment Fails

```
1. Netlify: Click "Revert to previous deploy"
2. Vercel: Redeploy previous working commit
3. GitHub: Git revert and push
```

### Quick Rollback

```bash
# Frontend
cd frontend
git revert HEAD
git push origin main
# Netlify auto-deploys

# Backend
cd backend
git revert HEAD
git push origin main
# Vercel auto-deploys
```

---

This architecture ensures:
- ✅ High availability
- ✅ Automatic scaling
- ✅ Global CDN
- ✅ HTTPS by default
- ✅ Easy deployments
- ✅ Cost-effective (free tier)
