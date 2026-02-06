#!/bin/bash
# scripts/integration-test.sh

set -e  # Exit on any error

echo "🧪 Starting Integration Tests..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "1️⃣  Checking if server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
  echo -e "${RED}❌ Server not running. Start with: npm run dev${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Server is running${NC}"
echo ""

# Test health check endpoint
echo "2️⃣  Testing health check endpoint..."
HEALTH=$(curl -s http://localhost:3000/api/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" = "healthy" ]; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  echo $HEALTH | jq '.services'
elif [ "$STATUS" = "degraded" ]; then
  echo -e "${YELLOW}⚠️  Health check degraded${NC}"
  echo $HEALTH | jq '.services'
else
  echo -e "${RED}❌ Health check failed${NC}"
  echo $HEALTH | jq
  exit 1
fi
echo ""

# Test database connectivity
echo "3️⃣  Testing database connectivity..."
DB_STATUS=$(echo $HEALTH | jq -r '.services.database.status')
if [ "$DB_STATUS" = "healthy" ]; then
  echo -e "${GREEN}✅ Database connected${NC}"
  echo "   Latency: $(echo $HEALTH | jq -r '.services.database.latency')ms"
else
  echo -e "${RED}❌ Database connection failed${NC}"
  echo $HEALTH | jq '.services.database'
  exit 1
fi
echo ""

# Test storage service
echo "4️⃣  Testing storage service..."
STORAGE_STATUS=$(echo $HEALTH | jq -r '.services.storage.status')
if [ "$STORAGE_STATUS" = "healthy" ]; then
  echo -e "${GREEN}✅ Storage service accessible${NC}"
  echo "   Latency: $(echo $HEALTH | jq -r '.services.storage.latency')ms"
else
  echo -e "${RED}❌ Storage service failed${NC}"
  echo $HEALTH | jq '.services.storage'
  exit 1
fi
echo ""

# Test email service
echo "5️⃣  Testing email service..."
EMAIL_STATUS=$(echo $HEALTH | jq -r '.services.email.status')
if [ "$EMAIL_STATUS" = "healthy" ]; then
  echo -e "${GREEN}✅ Email service configured${NC}"
else
  echo -e "${RED}❌ Email service failed${NC}"
  echo $HEALTH | jq '.services.email'
  exit 1
fi
echo ""

# Test environment validation
echo "6️⃣  Testing environment validation..."
if npm run validate-env > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Environment variables validated${NC}"
else
  echo -e "${RED}❌ Environment validation failed${NC}"
  exit 1
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 All integration tests passed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "System Information:"
echo "  Uptime: $(echo $HEALTH | jq -r '.system.uptime')s"
echo "  Memory: $(echo $HEALTH | jq -r '.system.memory.used')MB / $(echo $HEALTH | jq -r '.system.memory.total')MB ($(echo $HEALTH | jq -r '.system.memory.percentage')%)"
echo "  Environment: $(echo $HEALTH | jq -r '.environment')"
echo ""
echo "Next steps:"
echo "  1. Test OAuth flow manually (Google sign-in)"
echo "  2. Send test email via /api/test/email"
echo "  3. Upload test file via /api/test/storage"
echo ""
