# 🚀 Deployment Setup Complete!

Your Planning Insights application is now ready for deployment to Netlify (frontend) and Vercel (backend).

## 📁 Files Created

### Configuration Files
- ✅ `frontend/netlify.toml` - Netlify build configuration
- ✅ `backend/vercel.json` - Vercel deployment configuration
- ✅ `frontend/.gitignore` - Updated with build outputs
- ✅ `backend/.gitignore` - Added environment files and uploads

### Environment Templates
- ✅ `frontend/.env.example` - Frontend environment template
- ✅ `backend/.env.example` - Backend environment template

### Documentation
- ✅ `DEPLOYMENT_GUIDE.md` - Complete step-by-step deployment guide
- ✅ `DEPLOYMENT_CHECKLIST.md` - Checklist to track deployment progress
- ✅ `prepare-deployment.sh` - Script to verify deployment readiness

---

## 🎯 Quick Start Guide

### 1. Preparation (10 minutes)

#### Set up MongoDB Atlas
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create free cluster (M0)
3. Create database user
4. Allow network access (0.0.0.0/0)
5. Get connection string

#### Run Preparation Script
```bash
./prepare-deployment.sh
```

### 2. Deploy Backend to Vercel (15 minutes)

#### Push to GitHub
```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
# Create repo on GitHub: planning-insights-backend
git remote add origin https://github.com/YOUR_USERNAME/planning-insights-backend.git
git push -u origin main
```

#### Deploy on Vercel
1. Go to https://vercel.com
2. Import `planning-insights-backend` repo
3. Add environment variables (see checklist)
4. Deploy
5. Save your Vercel URL

### 3. Deploy Frontend to Netlify (10 minutes)

#### Update API URL
```bash
cd frontend
# Edit .env and set VITE_API_URL to your Vercel URL
nano .env
```

#### Push to GitHub
```bash
git init
git add .
git commit -m "Initial frontend commit"
# Create repo on GitHub: planning-insights-frontend
git remote add origin https://github.com/YOUR_USERNAME/planning-insights-frontend.git
git push -u origin main
```

#### Deploy on Netlify
1. Go to https://www.netlify.com
2. Import `planning-insights-frontend` repo
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variable: `VITE_API_URL`
6. Deploy
7. Save your Netlify URL

### 4. Final Configuration (5 minutes)

#### Update Backend CORS
1. Go to Vercel project settings
2. Update `FRONTEND_URL` to your Netlify URL
3. Redeploy

#### Test Everything
- Visit your Netlify URL
- Test registration/login
- Test file uploads
- Check browser console

---

## 📋 Environment Variables Reference

### Backend (Vercel)
```env
PORT=3000
FRONTEND_URL=https://your-app.netlify.app
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/planning_insights
JWT_SECRET=your-32-character-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=Planning Insights <your-email@gmail.com>
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n
DEBUG_AUTH=false
ADMIN_SEED_EMAIL=admin@yourdomain.com
ADMIN_SEED_PASSWORD=SecurePassword123!
```

### Frontend (Netlify)
```env
VITE_API_URL=https://your-backend.vercel.app
```

---

## 🔧 Important Notes

### MongoDB
- **Must use MongoDB Atlas** (cloud database)
- Local MongoDB won't work with Vercel
- Free tier (M0) is sufficient for testing

### Firebase Private Key
- Keep `\n` as literal characters in Vercel
- Don't convert to actual newlines
- Example: `-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n`

### CORS
- Backend `FRONTEND_URL` must match Netlify URL exactly
- No trailing slashes
- Must include https://

### Environment Variables
- Vercel: Redeploy after changing variables
- Netlify: Clear cache and redeploy after changing
- Frontend variables must start with `VITE_`

---

## 🐛 Common Issues & Solutions

### ❌ "CORS policy blocked"
**Fix**: Update `FRONTEND_URL` in Vercel to match Netlify URL, redeploy

### ❌ "Cannot connect to database"
**Fix**: Verify MongoDB Atlas connection string, check network access

### ❌ "API calls failing"
**Fix**: Check `VITE_API_URL` in Netlify matches Vercel backend URL

### ❌ "404 on page refresh"
**Fix**: Already configured in netlify.toml (redirects)

### ❌ "Environment variables not working"
**Fix**: Redeploy after adding variables, ensure proper naming

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment instructions |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist with checkboxes |
| `README_DEPLOYMENT.md` | This file - quick reference |
| `prepare-deployment.sh` | Verification script |

---

## 🎓 Learning Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ Deployment Checklist (Quick)

- [ ] MongoDB Atlas cluster created
- [ ] Backend pushed to GitHub
- [ ] Backend deployed to Vercel
- [ ] All backend env variables set
- [ ] Frontend .env updated with backend URL
- [ ] Frontend pushed to GitHub
- [ ] Frontend deployed to Netlify
- [ ] Frontend env variable set
- [ ] Backend FRONTEND_URL updated
- [ ] Application tested end-to-end

---

## 📞 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review Vercel/Netlify deployment logs
3. Check browser console for errors
4. Verify all environment variables

---

## 🎉 Deployment Timeline

**Estimated Total Time**: 40-60 minutes

- MongoDB Atlas setup: 10 min
- Backend deployment: 15 min
- Frontend deployment: 10 min
- Configuration & testing: 10 min
- Troubleshooting buffer: 15 min

---

**Good luck with your deployment! 🚀**

For detailed instructions, start with `DEPLOYMENT_CHECKLIST.md`
