# Deployment Checklist

Use this checklist to ensure smooth deployment of your application.

## Pre-Deployment

### MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create free cluster (M0)
- [ ] Create database user with read/write permissions
- [ ] Add Network Access (0.0.0.0/0 or specific IPs)
- [ ] Get connection string
- [ ] Test connection locally by updating `.env` with Atlas URI

### Code Preparation
- [ ] Remove sensitive data from code
- [ ] Update `.gitignore` files (backend & frontend)
- [ ] Create `.env.example` files (done ✓)
- [ ] Test application locally with production-like settings
- [ ] Commit all changes

### GitHub Setup
- [ ] Create GitHub repository for backend: `planning-insights-backend`
- [ ] Create GitHub repository for frontend: `planning-insights-frontend`
- [ ] Push backend code to GitHub
- [ ] Push frontend code to GitHub

---

## Backend Deployment (Vercel)

### Initial Setup
- [ ] Sign up/login to Vercel
- [ ] Import backend repository from GitHub
- [ ] Configure build settings (leave default)

### Environment Variables
Add these to Vercel project settings:

- [ ] `PORT=3000`
- [ ] `FRONTEND_URL` (will update after frontend deployment)
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `MAIL_FROM`
- [ ] `FIREBASE_PROJECT_ID`
- [ ] `FIREBASE_CLIENT_EMAIL`
- [ ] `FIREBASE_PRIVATE_KEY` (keep \n as literal)
- [ ] `DEBUG_AUTH=false`
- [ ] `JWT_SECRET` (generate strong 32+ char secret)
- [ ] `MONGODB_URI` (from MongoDB Atlas)
- [ ] `ADMIN_SEED_EMAIL`
- [ ] `ADMIN_SEED_PASSWORD`

### Deploy & Verify
- [ ] Click Deploy
- [ ] Wait for deployment to complete
- [ ] Copy Vercel URL (e.g., `https://planning-insights-backend.vercel.app`)
- [ ] Test: Visit `{vercel-url}/health`
- [ ] Check deployment logs for errors

---

## Frontend Deployment (Netlify)

### Pre-Deployment
- [ ] Update `frontend/.env` with backend Vercel URL:
  ```
  VITE_API_URL=https://your-backend.vercel.app
  ```
- [ ] Commit and push changes

### Initial Setup
- [ ] Sign up/login to Netlify
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Connect GitHub account
- [ ] Import frontend repository

### Build Settings
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] Base directory: (leave empty)

### Environment Variables
Add to Netlify project settings:

- [ ] `VITE_API_URL` (your Vercel backend URL)

### Deploy & Verify
- [ ] Click Deploy
- [ ] Wait for deployment to complete
- [ ] Copy Netlify URL (e.g., `https://planning-insights.netlify.app`)
- [ ] Visit site and test basic functionality
- [ ] Check browser console for errors

---

## Post-Deployment Configuration

### Update Backend CORS
- [ ] Go to Vercel project settings
- [ ] Update `FRONTEND_URL` environment variable with Netlify URL
- [ ] Trigger redeployment in Vercel

### Testing
- [ ] Test user registration
- [ ] Test login functionality
- [ ] Test file uploads
- [ ] Test API calls from frontend to backend
- [ ] Check email functionality
- [ ] Test Firebase authentication
- [ ] Test MongoDB operations (CRUD)
- [ ] Test real-time features (Socket.io)

### Security Review
- [ ] Verify all environment variables are set correctly
- [ ] Confirm no sensitive data in GitHub repos
- [ ] Check `DEBUG_AUTH=false` in production
- [ ] Verify CORS is restricted to your frontend URL only
- [ ] Test with HTTPS (both platforms use HTTPS by default)
- [ ] Review MongoDB network access restrictions

---

## Troubleshooting

### If frontend can't connect to backend:
1. Check `VITE_API_URL` in Netlify settings
2. Verify `FRONTEND_URL` in Vercel settings
3. Check CORS configuration in backend
4. Look at browser console for errors
5. Check Vercel function logs

### If MongoDB connection fails:
1. Verify connection string format
2. Check MongoDB Atlas network access
3. Confirm database user permissions
4. Look at Vercel function logs
5. Test connection string locally first

### If authentication fails:
1. Check `JWT_SECRET` is set in Vercel
2. Verify Firebase credentials
3. Check Firebase project settings
4. Review Vercel logs

---

## Maintenance

### Regular Tasks
- [ ] Monitor Vercel usage and logs
- [ ] Monitor Netlify bandwidth
- [ ] Check MongoDB Atlas storage and usage
- [ ] Review security logs
- [ ] Keep dependencies updated

### Updating Code
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub
4. Vercel/Netlify will auto-deploy (if configured)
5. Verify deployment

---

## Quick Commands Reference

### Test Build Locally
```bash
# Frontend
cd frontend
npm run build
npm run preview

# Backend (test with MongoDB Atlas)
cd backend
# Update .env with MongoDB Atlas URI
npm start
```

### Push to GitHub
```bash
# Backend
cd backend
git add .
git commit -m "Update backend"
git push origin main

# Frontend
cd frontend
git add .
git commit -m "Update frontend"
git push origin main
```

---

## Important URLs to Save

- **Frontend URL**: ___________________________________
- **Backend URL**: ___________________________________
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Netlify Dashboard**: https://app.netlify.com
- **GitHub Backend**: ___________________________________
- **GitHub Frontend**: ___________________________________

---

## Support Contacts

- Vercel Support: https://vercel.com/support
- Netlify Support: https://www.netlify.com/support/
- MongoDB Atlas Support: https://www.mongodb.com/support

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Notes**: _____________________________________________
