# Deployment Guide

This guide will help you deploy the Planning Insights application:
- **Frontend** on Netlify
- **Backend** on Vercel

## Prerequisites

1. GitHub account
2. MongoDB Atlas account (for cloud database)
3. Netlify account
4. Vercel account
5. Firebase project (already configured)

---

## Part 1: Prepare MongoDB Atlas

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a **Free Cluster** (M0)
4. Choose your preferred cloud provider and region
5. Wait for cluster creation (2-5 minutes)

### Step 2: Setup Database Access

1. Go to **Database Access** (left sidebar)
2. Click **Add New Database User**
3. Create a username and strong password
4. Grant **Read and Write to any database** privileges
5. Save the credentials securely

### Step 3: Setup Network Access

1. Go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
   - Or add specific IPs for better security
4. Confirm

### Step 4: Get Connection String

1. Go to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
   ```
5. Replace `<username>` and `<password>` with your actual credentials
6. Add your database name at the end: `planning_insights`

Final format:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/planning_insights
```

---

## Part 2: Deploy Backend to Vercel

### Step 1: Push to GitHub

```bash
# Navigate to backend directory
cd backend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial backend commit"

# Create a new repository on GitHub named "planning-insights-backend"
# Then push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/planning-insights-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Click **Add New Project**
3. Import your `planning-insights-backend` repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (or leave blank)
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

### Step 3: Add Environment Variables

In Vercel project settings, go to **Settings > Environment Variables** and add:

```
PORT=3000
FRONTEND_URL=https://your-frontend-app.netlify.app
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=Planning Insights <your-email@gmail.com>
FIREBASE_PROJECT_ID=planninginsight-4d5c2
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@planninginsight-4d5c2.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n
DEBUG_AUTH=false
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/planning_insights
ADMIN_SEED_EMAIL=admin@yourdomain.com
ADMIN_SEED_PASSWORD=SecurePassword123!
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`: Keep the `\n` as literal characters (don't convert to newlines)
- Generate a strong `JWT_SECRET` (at least 32 characters)
- Use your MongoDB Atlas connection string
- Update `FRONTEND_URL` after deploying frontend

### Step 4: Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. Note your Vercel URL: `https://your-backend-app.vercel.app`

### Step 5: Test Backend

Visit: `https://your-backend-app.vercel.app/health`

You should see a health check response.

---

## Part 3: Deploy Frontend to Netlify

### Step 1: Update Environment Variable

In `frontend/.env`, update:
```
VITE_API_URL=https://your-backend-app.vercel.app
```
Replace with your actual Vercel backend URL.

### Step 2: Push to GitHub

```bash
# Navigate to frontend directory
cd frontend

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial frontend commit"

# Create a new repository on GitHub named "planning-insights-frontend"
# Then push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/planning-insights-frontend.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Netlify

1. Go to [Netlify](https://www.netlify.com)
2. Click **Add new site > Import an existing project**
3. Choose **GitHub** and authorize
4. Select your `planning-insights-frontend` repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: Leave empty

### Step 4: Add Environment Variables

In Netlify project settings, go to **Site settings > Environment variables** and add:

```
VITE_API_URL=https://your-backend-app.vercel.app
```

Replace with your actual Vercel backend URL.

### Step 5: Deploy

1. Click **Deploy site**
2. Wait for deployment to complete
3. Note your Netlify URL: `https://your-frontend-app.netlify.app`

---

## Part 4: Update CORS & URLs

### Step 1: Update Backend Environment

Go back to Vercel project settings and update:

```
FRONTEND_URL=https://your-frontend-app.netlify.app
```

Replace with your actual Netlify frontend URL.

### Step 2: Redeploy Backend

In Vercel dashboard:
1. Go to your backend project
2. Click **Deployments**
3. Click the three dots on latest deployment
4. Click **Redeploy**

---

## Part 5: Verify Deployment

### Test Backend:
```bash
curl https://your-backend-app.vercel.app/health
```

### Test Frontend:
1. Visit your Netlify URL
2. Try to register/login
3. Check browser console for errors

---

## Common Issues & Solutions

### 1. CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**: 
- Verify `FRONTEND_URL` in Vercel matches your Netlify URL exactly
- Check backend CORS configuration in `backend/src/app.js`
- Ensure no trailing slashes in URLs

### 2. MongoDB Connection Failed

**Problem**: Backend can't connect to database

**Solution**:
- Verify MongoDB Atlas connection string is correct
- Check username and password (no special characters that need encoding)
- Ensure Network Access allows all IPs (0.0.0.0/0)
- Make sure database user has proper permissions

### 3. Environment Variables Not Working

**Problem**: App doesn't use environment variables

**Solution**:
- In Vercel: Redeploy after adding variables
- In Netlify: Clear cache and redeploy
- Check variable names (VITE_ prefix for frontend)
- Restart build process

### 4. 404 Errors on Frontend Routes

**Problem**: Refreshing page shows 404

**Solution**: Already configured in `netlify.toml` with redirects

### 5. Firebase Authentication Issues

**Problem**: Firebase auth not working

**Solution**:
- Verify Firebase config in frontend
- Check Firebase Admin credentials in backend
- Ensure Firebase project allows your domains

---

## Security Checklist

- [ ] Use strong JWT_SECRET (min 32 characters)
- [ ] Use MongoDB Atlas with authentication
- [ ] Set DEBUG_AUTH=false in production
- [ ] Use environment variables (never commit secrets)
- [ ] Enable HTTPS only (both platforms do this by default)
- [ ] Set up proper CORS (only allow your frontend URL)
- [ ] Use strong admin password
- [ ] Review and restrict MongoDB network access if possible

---

## Useful Commands

### Local Development
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Build Locally (Test Before Deploy)
```bash
# Frontend
cd frontend
npm run build
npm run preview
```

---

## Support

If you encounter issues:
1. Check Vercel/Netlify deployment logs
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure MongoDB Atlas is accessible

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
