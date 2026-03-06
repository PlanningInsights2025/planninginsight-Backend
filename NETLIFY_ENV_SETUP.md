# Netlify Environment Variables Setup

## Issue Fixed
Moved Firebase API keys from hardcoded values to environment variables to prevent Netlify's secret scanner from blocking deployments.

## Required Action: Add Environment Variables to Netlify

You need to add the following environment variables to your Netlify site settings:

### Steps:

1. **Go to Netlify Dashboard**
   - Open https://app.netlify.com
   - Select your `planninginsight-frontend` site

2. **Navigate to Environment Variables**
   - Click on **Site settings**
   - Click on **Environment variables** in the left sidebar
   - Click **Add a variable** or **Add environment variable**

3. **CRITICAL: Add This First to Bypass Secret Scanner:**

```bash
SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES=AIzaSyA-T2kCehqBiWDClMzyx6hUwDx7o2uf8lw
```

This tells Netlify to ignore the Firebase API key (which is meant to be public).

4. **Add These Variables One by One:**

```bash
# API Configuration (Already set)
VITE_API_BASE_URL=https://planninginsight-backend.vercel.app/api

# Firebase Configuration (ADD THESE NOW)
VITE_FIREBASE_API_KEY=AIzaSyA-T2kCehqBiWDClMzyx6hUwDx7o2uf8lw
VITE_FIREBASE_AUTH_DOMAIN=planninginsight-4d5c2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=planninginsight-4d5c2
VITE_FIREBASE_STORAGE_BUCKET=planninginsight-4d5c2.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=763015079836
VITE_FIREBASE_APP_ID=1:763015079836:web:5a5d0c9b1cf89c3f184a59
VITE_FIREBASE_MEASUREMENT_ID=G-E2MKPKTK90
```

### Quick Copy-Paste Format:

For each variable, copy the **Key** and **Value** separately:

**FIRST - Secret Scanner Bypass (REQUIRED):**

| Key | Value |
|-----|-------|
| `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` | `AIzaSyA-T2kCehqBiWDClMzyx6hUwDx7o2uf8lw` |

**THEN - Firebase Config:**

| Key | Value |
|-----|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyA-T2kCehqBiWDClMzyx6hUwDx7o2uf8lw` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `planninginsight-4d5c2.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `planninginsight-4d5c2` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `planninginsight-4d5c2.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `763015079836` |
| `VITE_FIREBASE_APP_ID` | `1:763015079836:web:5a5d0c9b1cf89c3f184a59` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-E2MKPKTK90` |

5. **Verify and Deploy**
   - After adding all variables, click **Save**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - The build should now succeed without the secret scanner error

## Why This Change?

**The Problem:**
- Netlify's secret scanner detected the Firebase API key in the bundled JavaScript output
- Even though we use environment variables, Vite bundles their values into the code at build time
- The scanner found `AIza***` at line 2833 in the built file and blocked deployment

**The Solution:**
- Added `SECRETS_SCAN_SMART_DETECTION_OMIT_VALUES` to tell Netlify to ignore this specific value
- Firebase web API keys are meant to be public - they're secured by Firebase security rules on the backend, not by keeping the key secret
- This is documented in Firebase's official documentation as safe practice

**Note:** Firebase web API keys for client apps are designed to be public. Security is enforced through:
- Firebase Security Rules (Firestore/Storage)
- Firebase Authentication
- API restrictions in Google Cloud Console
- App Check (optional additional security)

The key in the browser code is expected and safe.

## Testing Locally

Your local `.env` file already has these values, so local development will work without changes.

## Next Steps

1. Add the environment variables to Netlify (as shown above)
2. Trigger a new deploy
3. Verify the build completes successfully
4. Test Firebase authentication on the deployed site

## Troubleshooting

**If the build still fails:**
- Double-check that all environment variable names are spelled correctly (case-sensitive)
- Ensure there are no extra spaces in the values
- Make sure you clicked "Save" after adding the variables

**If Firebase doesn't work on the deployed site:**
- Check the browser console for errors
- Verify that all 7 Firebase environment variables are set in Netlify
- Ensure the values match exactly (especially the API key)
