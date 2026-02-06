#!/bin/bash

################################################################################
# Build and Run Production Script
# 
# This script builds the Wasp project and runs it in production mode locally
################################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Unicon Schedule - Build & Run Production${NC}"
echo "=============================================="
echo ""

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Use Node 22
echo -e "${YELLOW}📦 Switching to Node 22...${NC}"
nvm use 22
node --version
echo ""

# Go to project root
cd /home/kimei-user/workspace/unicon_schedule

# Step 1: Build
echo -e "${YELLOW}🏗️  Step 1: Building Wasp project...${NC}"
wasp build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed!${NC}"
echo ""

# Step 2: Setup server
echo -e "${YELLOW}⚙️  Step 2: Setting up server...${NC}"
cd .wasp/build/server

# Install dependencies
echo "Installing production dependencies..."
npm install --production --silent

# Copy .env
echo "Copying environment variables..."
cp ../../../.env.server .env 2>/dev/null || {
    echo -e "${YELLOW}⚠️  .env.server not found, creating default .env${NC}"
    cat > .env << 'EOF'
DATABASE_URL=postgresql://nguyentu@localhost:5432/unicon_schedule
SMTP_HOST=smtp.larksuite.com
SMTP_PORT=465
SMTP_USERNAME=no-reply@unicon.ltd
SMTP_PASSWORD=Ubkv9EAS9SXqefoa
SMTP_TLS=true
WASP_WEB_CLIENT_URL=http://localhost:3000
WASP_SERVER_URL=http://localhost:3001
SESSION_SECRET=development-secret-key-change-in-production-min-32-chars
NODE_ENV=production
PORT=3001
EOF
}

# Add missing env vars if needed
if ! grep -q "WASP_WEB_CLIENT_URL" .env; then
    echo "WASP_WEB_CLIENT_URL=http://localhost:3000" >> .env
fi
if ! grep -q "WASP_SERVER_URL" .env; then
    echo "WASP_SERVER_URL=http://localhost:3001" >> .env
fi
if ! grep -q "SESSION_SECRET" .env; then
    echo "SESSION_SECRET=development-secret-key-change-in-production-min-32-chars" >> .env
fi
if ! grep -q "NODE_ENV" .env; then
    echo "NODE_ENV=production" >> .env
fi
if ! grep -q "PORT" .env; then
    echo "PORT=3001" >> .env
fi

echo -e "${GREEN}✅ Server setup completed!${NC}"
echo ""

# Step 3: Bundle server code
echo -e "${YELLOW}📦 Step 3: Bundling server code...${NC}"
npm run bundle

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Bundle failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Bundle completed!${NC}"
echo ""

# Step 4: Create uploads structure
echo -e "${YELLOW}📁 Step 4: Creating uploads structure...${NC}"
cd ..
mkdir -p public/uploads/drivers/citizen_id
mkdir -p public/uploads/drivers/license
mkdir -p public/uploads/vehicles/registration
mkdir -p public/uploads/vehicles/inspection
mkdir -p public/uploads/vehicles/insurance
mkdir -p public/uploads/debts/invoices
mkdir -p public/uploads/debts/payments
echo -e "${GREEN}✅ Uploads structure created!${NC}"
echo ""

# Step 5: Start server
cd server
echo -e "${YELLOW}🚀 Step 5: Starting production server...${NC}"
echo ""
echo -e "${GREEN}Server will start on: http://localhost:3001${NC}"
echo -e "${BLUE}Press Ctrl+C to stop${NC}"
echo ""
echo "=============================================="
echo ""

# Start server
npm start
