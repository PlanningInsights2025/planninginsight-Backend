# 🚀 Quick Deployment Commands

## Pre-Deployment

```bash
# Run preparation check
./prepare-deployment.sh

# Test frontend build
cd frontend
npm run build
npm run preview

# Test backend (with MongoDB running)
cd backend
npm start
```

---

## GitHub Setup

### Backend Repository
```bash
cd backend
git init
git add .
git commit -m "Initial backend commit for deployment"
git remote add origin https://github.com/YOUR_USERNAME/planning-insights-backend.git
git branch -M main
git push -u origin main
```

### Frontend Repository
```bash
cd frontend
git add .
git commit -m "Initial frontend commit for deployment"
git remote add origin https://github.com/YOUR_USERNAME/planning-insights-frontend.git
git branch -M main
git push -u origin main
```

---

## Update Environment URLs

### Before Frontend Deployment
```bash
cd frontend
nano .env
# Change: VITE_API_URL=https://your-backend.vercel.app
git add .env
git commit -m "Update API URL for production"
git push
```

### After Frontend Deployment
Go to Vercel → Your Project → Settings → Environment Variables
```
FRONTEND_URL=https://your-frontend.netlify.app
```
Then click "Redeploy" in Vercel

---

## Deployment URLs

### Set These After Deployment

**Backend URL (Vercel):**
```
https://_________________________________.vercel.app
```

**Frontend URL (Netlify):**
```
https://_________________________________.netlify.app
```

**MongoDB Atlas Connection:**
```
mongodb+srv://user:pass@cluster.mongodb.net/planning_insights
```

---

## Environment Variables Checklist

### Backend (Vercel) - 14 Variables
```
☐ PORT=3000
☐ FRONTEND_URL=https://your-app.netlify.app
☐ MONGODB_URI=mongodb+srv://...
☐ JWT_SECRET=your-secret-32-chars-min
☐ SMTP_HOST=smtp.gmail.com
☐ SMTP_PORT=465
☐ SMTP_USER=email@gmail.com
☐ SMTP_PASS=app-password
☐ MAIL_FROM=App Name <email@gmail.com>
☐ FIREBASE_PROJECT_ID=project-id
☐ FIREBASE_CLIENT_EMAIL=email@project.iam.gserviceaccount.com
☐ FIREBASE_PRIVATE_KEY=-----BEGIN...-----
☐ DEBUG_AUTH=false
☐ ADMIN_SEED_EMAIL=admin@domain.com
☐ ADMIN_SEED_PASSWORD=SecurePass123!
```

### Frontend (Netlify) - 1 Variable
```
☐ VITE_API_URL=https://your-backend.vercel.app
```

---

## Testing Commands

### Test Backend API
```bash
# Health check
curl https://your-backend.vercel.app/health

# Or in browser
https://your-backend.vercel.app/health
```

### Test Frontend
```bash
# Open in browser
https://your-frontend.netlify.app

# Check API connection in browser console (F12)
```

---

## Common Fix Commands

### Clear and Reinstall Dependencies
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Force Redeploy

**Netlify:**
```bash
cd frontend
git commit --allow-empty -m "Trigger rebuild"
git push
```

**Vercel:**
```bash
cd backend
git commit --allow-empty -m "Trigger rebuild"
git push
```

---

## MongoDB Atlas Quick Setup

```bash
# 1. Create cluster at https://cloud.mongodb.com
# 2. Create database user:
#    Username: planninginsights
#    Password: [generate strong password]
# 3. Network Access: Add 0.0.0.0/0
# 4. Get connection string:
#    Connect → Drivers → Copy connection string
# 5. Format:
mongodb+srv://planninginsights:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/planning_insights
```

---

## JWT Secret Generator

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or online: https://randomkeygen.com/
```

---

## Deployment Order

```
1. ✅ Set up MongoDB Atlas
2. ✅ Push backend to GitHub
3. ✅ Deploy backend to Vercel (add env vars)
4. ✅ Copy Vercel URL
5. ✅ Update frontend .env with Vercel URL
6. ✅ Push frontend to GitHub
7. ✅ Deploy frontend to Netlify (add env var)
8. ✅ Copy Netlify URL
9. ✅ Update FRONTEND_URL in Vercel
10. ✅ Redeploy Vercel backend
11. ✅ Test application
```

---

## Emergency Rollback

### Netlify
1. Go to Deploys
2. Click on previous working deploy
3. Click "Publish deploy"

### Vercel
1. Go to Deployments
2. Click ••• on previous working deploy
3. Click "Promote to Production"

---

## Support Links

- **Netlify Dashboard:** https://app.netlify.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **MongoDB Atlas:** https://cloud.mongodb.com
- **GitHub:** https://github.com

---

## Log Locations

```
Frontend Errors:
→ Browser Console (F12)
→ Netlify: Site → Deploys → [Deploy] → Deploy log

Backend Errors:
→ Vercel: Project → Logs
→ Vercel: Deployments → [Deployment] → Build logs

Database Issues:
→ MongoDB Atlas: Clusters → Metrics
```

---

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS error | Update FRONTEND_URL in Vercel, redeploy |
| API not found | Check VITE_API_URL in Netlify |
| DB connection fail | Verify MONGODB_URI, check Atlas network access |
| 404 on refresh | Already fixed in netlify.toml |
| Env vars not working | Redeploy after adding variables |
| Build failed | Check deployment logs for errors |

---

## Platform-Specific Commands

### Netlify CLI (Optional)
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### Vercel CLI (Optional)
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `README_DEPLOYMENT.md` | Quick start guide |
| `DEPLOYMENT_GUIDE.md` | Detailed step-by-step instructions |
| `DEPLOYMENT_CHECKLIST.md` | Interactive checklist |
| `DEPLOYMENT_ARCHITECTURE.md` | System architecture |
| `QUICK_DEPLOY.md` | This file - command reference |

---

**Print this page and keep it handy during deployment!**

**Estimated deployment time: 40-60 minutes**
