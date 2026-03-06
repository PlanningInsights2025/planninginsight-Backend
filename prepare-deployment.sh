#!/bin/bash

# Quick Deployment Preparation Script
# Run this to verify your app is ready for deployment

echo "🚀 Planning Insights - Deployment Preparation"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo "📋 Step 1: Checking environment files..."
echo ""

# Check frontend .env
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} frontend/.env exists"
    echo "   Current API URL:"
    grep "VITE_API_URL" frontend/.env || echo -e "${YELLOW}   ⚠ VITE_API_URL not set${NC}"
else
    echo -e "${RED}✗${NC} frontend/.env missing"
    echo "   Creating from example..."
    cp frontend/.env.example frontend/.env 2>/dev/null || echo -e "${YELLOW}   ⚠ No .env.example found${NC}"
fi
echo ""

# Check backend .env
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env exists"
else
    echo -e "${RED}✗${NC} backend/.env missing"
    echo "   Creating from example..."
    cp backend/.env.example backend/.env 2>/dev/null || echo -e "${YELLOW}   ⚠ No .env.example found${NC}"
fi
echo ""

echo "📋 Step 2: Checking dependencies..."
echo ""

# Check frontend dependencies
if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
fi

# Check backend dependencies
if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Backend dependencies not installed"
    echo "   Run: cd backend && npm install"
fi
echo ""

echo "📋 Step 3: Checking configuration files..."
echo ""

# Check netlify.toml
if [ -f "frontend/netlify.toml" ]; then
    echo -e "${GREEN}✓${NC} netlify.toml configured"
else
    echo -e "${RED}✗${NC} netlify.toml missing"
fi

# Check vercel.json
if [ -f "backend/vercel.json" ]; then
    echo -e "${GREEN}✓${NC} vercel.json configured"
else
    echo -e "${RED}✗${NC} vercel.json missing"
fi
echo ""

echo "📋 Step 4: Checking .gitignore files..."
echo ""

if [ -f "frontend/.gitignore" ]; then
    echo -e "${GREEN}✓${NC} frontend/.gitignore exists"
else
    echo -e "${YELLOW}⚠${NC} frontend/.gitignore missing"
fi

if [ -f "backend/.gitignore" ]; then
    echo -e "${GREEN}✓${NC} backend/.gitignore exists"
else
    echo -e "${YELLOW}⚠${NC} backend/.gitignore missing"
fi
echo ""

echo "=============================================="
echo "📦 Optional: Test Build Locally"
echo "=============================================="
echo ""
echo "Frontend build test:"
echo "  cd frontend && npm run build"
echo ""
echo "Backend test (ensure MongoDB is running):"
echo "  cd backend && npm start"
echo ""
echo "=============================================="
echo "📚 Next Steps:"
echo "=============================================="
echo ""
echo "1. Read DEPLOYMENT_GUIDE.md for detailed instructions"
echo "2. Use DEPLOYMENT_CHECKLIST.md to track progress"
echo "3. Set up MongoDB Atlas (if not done)"
echo "4. Push code to GitHub"
echo "5. Deploy backend to Vercel"
echo "6. Deploy frontend to Netlify"
echo ""
echo "Good luck with your deployment! 🚀"
