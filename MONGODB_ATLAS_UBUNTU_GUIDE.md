# MongoDB Atlas Setup Guide for Ubuntu

## Understanding MongoDB Atlas

**MongoDB Atlas** is a **cloud-hosted database** service. You don't install it on your Ubuntu machine - instead, you:
1. Create an account on MongoDB's website
2. Create a free cluster (database) in the cloud
3. Get a connection string
4. Use it in your application on Ubuntu

---

## Part 1: Create MongoDB Atlas Account

### Step 1: Sign Up

```bash
# Open your browser and visit:
https://www.mongodb.com/cloud/atlas/register
```

Or from terminal:
```bash
xdg-open https://www.mongodb.com/cloud/atlas/register
```

**Fill in:**
- Email address
- Password (strong password)
- First & Last name

Click **"Get started free"**

### Step 2: Choose Free Tier

When asked about deployment:
- Select **"M0 Free"** (512 MB storage)
- Choose cloud provider: **AWS** (recommended)
- Choose region: **Closest to your location** (e.g., Mumbai, Singapore, Frankfurt)
- Cluster name: Leave as default or name it `planning-insights-cluster`

Click **"Create Cluster"** (takes 3-5 minutes)

---

## Part 2: Configure Database Access

### Step 1: Create Database User

1. In Atlas dashboard, click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication method
4. Fill in:
   ```
   Username: planninginsights
   Password: [Click "Autogenerate Secure Password" or create your own]
   ```
   **⚠️ IMPORTANT:** Copy and save this password somewhere safe!

5. Database User Privileges: Select **"Read and write to any database"**
6. Click **"Add User"**

### Step 2: Whitelist Your IP Address

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (required for Vercel deployment)
   - Click **"Confirm"**

**Note:** For better security in production, you can restrict this later to specific IPs.

---

## Part 3: Get Connection String

### Step 1: Get the Connection String

1. Click **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. Copy the connection string (looks like this):

```
mongodb+srv://planninginsights:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Step 2: Format the Connection String

Replace `<password>` with your actual password and add database name:

**Before:**
```
mongodb+srv://planninginsights:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**After:**
```
mongodb+srv://planninginsights:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/planning_insights?retryWrites=true&w=majority
```

**Important changes:**
1. Replace `<password>` with your actual password
2. Add `/planning_insights` after `.net` (your database name)

---

## Part 4: Update Your Ubuntu Application

### Step 1: Update Backend .env File

```bash
# Navigate to backend directory
cd /home/aditya22/Downloads/Planning-Insights\(new\)/Planning-Insights\(1\)/Planning-Insights\(1\)/Planning-Insights/backend

# Edit .env file
nano .env
```

### Step 2: Update MONGODB_URI

Find the line:
```env
MONGODB_URI=mongodb://localhost:27017/planning_insights
```

Replace with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://planninginsights:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/planning_insights?retryWrites=true&w=majority
```

**Save and exit:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 3: Test Connection

```bash
# Make sure you're in backend directory
cd backend

# Start the server
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
📊 Database: planning_insights
🌐 Host: cluster0.xxxxx.mongodb.net
```

---

## Part 5: Using Both Local & Cloud MongoDB

### For Development (Ubuntu)

You can keep using **local MongoDB** for faster development:

```env
# .env (for local development)
MONGODB_URI=mongodb://localhost:27017/planning_insights
```

### For Production (Deployment)

Use **MongoDB Atlas** for Vercel deployment:

```env
# Vercel environment variable
MONGODB_URI=mongodb+srv://planninginsights:password@cluster0.xxxxx.mongodb.net/planning_insights
```

### Quick Switch Script

Create a helper script:

```bash
# Create switch script
nano ~/switch-mongo.sh
```

Add this content:
```bash
#!/bin/bash

PROJECT_DIR="/home/aditya22/Downloads/Planning-Insights(new)/Planning-Insights(1)/Planning-Insights(1)/Planning-Insights/backend"

if [ "$1" = "local" ]; then
    echo "Switching to LOCAL MongoDB..."
    sed -i 's|MONGODB_URI=mongodb+srv.*|MONGODB_URI=mongodb://localhost:27017/planning_insights|' "$PROJECT_DIR/.env"
    echo "✅ Now using local MongoDB"
elif [ "$1" = "atlas" ]; then
    echo "Switching to ATLAS MongoDB..."
    echo "⚠️  Make sure to update the connection string manually!"
    echo "Edit: $PROJECT_DIR/.env"
else
    echo "Usage: ./switch-mongo.sh [local|atlas]"
fi
```

Make it executable:
```bash
chmod +x ~/switch-mongo.sh
```

Use it:
```bash
# Switch to local
~/switch-mongo.sh local

# Switch to atlas
~/switch-mongo.sh atlas
```

---

## Part 6: Common Issues on Ubuntu

### Issue 1: Connection Timeout

**Problem:**
```
MongooseError: connect ETIMEDOUT
```

**Solutions:**

1. **Check internet connection:**
```bash
ping google.com
```

2. **Check firewall:**
```bash
# Check if UFW is blocking
sudo ufw status

# If active, allow outbound connections (usually allowed by default)
sudo ufw allow out 27017
```

3. **Verify IP whitelist in Atlas:**
   - Go to Atlas → Network Access
   - Ensure `0.0.0.0/0` is added

### Issue 2: Authentication Failed

**Problem:**
```
MongoServerError: bad auth : Authentication failed
```

**Solutions:**

1. **Check password has no special characters that need encoding:**

If your password has special characters like `@`, `#`, `!`, encode them:
```bash
# Use Python to encode
python3 -c "import urllib.parse; print(urllib.parse.quote('your@password#here', safe=''))"
```

2. **Verify username and password in Atlas:**
   - Atlas → Database Access
   - Check username matches
   - Reset password if needed

### Issue 3: DNS Resolution Failed

**Problem:**
```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.xxxxx.mongodb.net
```

**Solutions:**

1. **Check DNS:**
```bash
# Test DNS resolution
nslookup cluster0.xxxxx.mongodb.net

# If fails, try Google DNS
sudo nano /etc/resolv.conf
# Add: nameserver 8.8.8.8
```

2. **Update Ubuntu:**
```bash
sudo apt update
sudo apt upgrade
```

### Issue 4: SSL/TLS Issues

**Problem:**
```
Error: unable to get local issuer certificate
```

**Solution:**
```bash
# Update CA certificates
sudo apt-get install -y ca-certificates
sudo update-ca-certificates
```

---

## Part 7: Ubuntu-Specific Commands

### Check if Local MongoDB is Running

```bash
# Check MongoDB service status
sudo systemctl status mongod

# Start MongoDB (if installed locally)
sudo systemctl start mongod

# Stop MongoDB
sudo systemctl stop mongod

# Disable MongoDB on startup (when using Atlas)
sudo systemctl disable mongod
```

### Monitor Connection in Ubuntu

```bash
# Install MongoDB Compass (GUI) on Ubuntu
wget https://downloads.mongodb.com/compass/mongodb-compass_1.40.4_amd64.deb
sudo dpkg -i mongodb-compass_1.40.4_amd64.deb

# Or use mongosh (MongoDB Shell)
# Download from: https://www.mongodb.com/try/download/shell
# Then connect:
mongosh "mongodb+srv://planninginsights:password@cluster0.xxxxx.mongodb.net/planning_insights"
```

### View Backend Logs in Ubuntu

```bash
# Run backend and see logs
cd backend
npm run dev | tee backend-logs.txt

# View logs in real-time
tail -f backend-logs.txt
```

---

## Part 8: Verify Setup

### Quick Verification Checklist

```bash
# 1. Check .env file
cd backend
cat .env | grep MONGODB_URI
# Should show Atlas connection string

# 2. Test connection
npm run dev
# Should connect without errors

# 3. Test API endpoint
curl http://localhost:3000/health
# Should return success

# 4. Check database in Atlas
# Visit: https://cloud.mongodb.com
# Clusters → Browse Collections
# Should see 'planning_insights' database
```

---

## Part 9: Environment-Specific Configuration

### Create Multiple .env Files

```bash
cd backend

# Local development
cp .env .env.local
nano .env.local
# Set: MONGODB_URI=mongodb://localhost:27017/planning_insights

# Atlas/Production
cp .env .env.atlas
nano .env.atlas
# Set: MONGODB_URI=mongodb+srv://...

# Switch between them
cp .env.local .env  # Use local
# OR
cp .env.atlas .env  # Use atlas
```

### Update package.json Scripts

```bash
nano backend/package.json
```

Add these scripts:
```json
{
  "scripts": {
    "dev": "node src/server.js",
    "dev:local": "cp .env.local .env && node src/server.js",
    "dev:atlas": "cp .env.atlas .env && node src/server.js",
    "start": "node src/server.js"
  }
}
```

Use them:
```bash
# Use local MongoDB
npm run dev:local

# Use Atlas MongoDB
npm run dev:atlas
```

---

## Part 10: Ubuntu Firewall Configuration

### Allow MongoDB Atlas Connections

```bash
# Check UFW status
sudo ufw status

# If UFW is active, ensure outbound HTTPS is allowed (for Atlas)
sudo ufw allow out 443/tcp
sudo ufw allow out 27017/tcp

# Reload UFW
sudo ufw reload
```

---

## Quick Reference Card

### Connection Strings

**Local MongoDB (Ubuntu):**
```
mongodb://localhost:27017/planning_insights
```

**MongoDB Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/planning_insights
```

### Common Commands

```bash
# Edit environment variables
nano backend/.env

# Start backend with Atlas
cd backend && npm run dev

# Check connection
curl http://localhost:3000/health

# View Atlas dashboard
xdg-open https://cloud.mongodb.com
```

### Troubleshooting Commands

```bash
# Test internet connection
ping 8.8.8.8

# Check DNS
nslookup cluster0.xxxxx.mongodb.net

# Update certificates
sudo update-ca-certificates

# Check backend logs
cd backend && npm run dev 2>&1 | grep -i mongo
```

---

## Security Best Practices

### ✅ DO:
- Use strong passwords (16+ characters)
- Store connection string in `.env` (never commit to GitHub)
- Use environment variables in production
- Enable MongoDB Atlas backup (free tier)
- Regularly rotate passwords

### ❌ DON'T:
- Hardcode connection strings in code
- Share your Atlas password
- Commit `.env` file to Git
- Use simple passwords
- Ignore security warnings

---

## Next Steps

1. ✅ Create MongoDB Atlas account
2. ✅ Create free cluster
3. ✅ Create database user
4. ✅ Whitelist IP (0.0.0.0/0)
5. ✅ Get connection string
6. ✅ Update `backend/.env`
7. ✅ Test connection on Ubuntu
8. ✅ Use same connection string in Vercel

---

## Resources

- **MongoDB Atlas:** https://cloud.mongodb.com
- **Atlas Documentation:** https://docs.atlas.mongodb.com
- **Connection String Format:** https://docs.mongodb.com/manual/reference/connection-string/
- **Ubuntu MongoDB Guide:** https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

---

**Need help?** Check the troubleshooting section or MongoDB Atlas support!

**Ready to deploy?** Use the same connection string in your Vercel environment variables!
