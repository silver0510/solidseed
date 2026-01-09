#!/bin/bash

# Clear Authentication Data Script (SQL Version)
#
# This script clears all data from authentication-related tables
# for testing purposes using direct SQL commands.
#
# Usage:
#   ./scripts/clear-auth-data.sh [--confirm]
#   or
#   npm run clear-auth-data:sql

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for confirmation flag
SKIP_CONFIRM=false
if [[ "$1" == "--confirm" ]]; then
  SKIP_CONFIRM=true
fi

echo -e "${BLUE}🧹 Authentication Data Cleanup Script${NC}"
echo ""

# Warning message
if [[ "$SKIP_CONFIRM" == false ]]; then
  echo -e "${RED}⚠️  WARNING: This will delete ALL authentication data!${NC}"
  echo ""
  echo "This includes:"
  echo "  - All user accounts"
  echo "  - OAuth provider connections"
  echo "  - Password reset tokens"
  echo "  - Email verification tokens"
  echo "  - Authentication logs"
  echo "  - Active sessions"
  echo ""
  read -p "Are you sure you want to continue? (yes/no): " -r
  echo ""

  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Aborted.${NC}"
    exit 0
  fi
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ Error: .env.local file not found${NC}"
  echo "Please create .env.local with SUPABASE_DATABASE_URL"
  exit 1
fi

# Load environment variables
source .env.local

if [ -z "$SUPABASE_DATABASE_URL" ]; then
  echo -e "${RED}❌ Error: SUPABASE_DATABASE_URL not set${NC}"
  exit 1
fi

echo -e "${BLUE}🔗 Connecting to database...${NC}"
echo ""

# SQL commands to clear data (in correct order for foreign key constraints)
SQL_COMMANDS=$(cat <<'EOF'
BEGIN;

-- Delete auth logs first (no dependencies)
DELETE FROM auth_logs;

-- Delete email verifications
DELETE FROM email_verifications;

-- Delete password resets
DELETE FROM password_resets;

-- Delete OAuth providers (depends on users)
DELETE FROM oauth_providers;

-- Delete Better Auth sessions
DELETE FROM session;

-- Delete Better Auth accounts
DELETE FROM account;

-- Delete Better Auth verification tokens
DELETE FROM verification;

-- Finally delete users (everything depends on this)
DELETE FROM users;

COMMIT;

-- Return counts
SELECT 'auth_logs' as table_name, COUNT(*) as remaining FROM auth_logs
UNION ALL
SELECT 'email_verifications', COUNT(*) FROM email_verifications
UNION ALL
SELECT 'password_resets', COUNT(*) FROM password_resets
UNION ALL
SELECT 'oauth_providers', COUNT(*) FROM oauth_providers
UNION ALL
SELECT 'session', COUNT(*) FROM session
UNION ALL
SELECT 'account', COUNT(*) FROM account
UNION ALL
SELECT 'verification', COUNT(*) FROM verification
UNION ALL
SELECT 'users', COUNT(*) FROM users;
EOF
)

# Execute SQL commands
echo -e "${YELLOW}1️⃣  Clearing auth logs...${NC}"
echo -e "${YELLOW}2️⃣  Clearing email verifications...${NC}"
echo -e "${YELLOW}3️⃣  Clearing password resets...${NC}"
echo -e "${YELLOW}4️⃣  Clearing OAuth providers...${NC}"
echo -e "${YELLOW}5️⃣  Clearing Better Auth sessions...${NC}"
echo -e "${YELLOW}6️⃣  Clearing Better Auth accounts...${NC}"
echo -e "${YELLOW}7️⃣  Clearing Better Auth verification tokens...${NC}"
echo -e "${YELLOW}8️⃣  Clearing users...${NC}"
echo ""

# Run the SQL commands
psql "$SUPABASE_DATABASE_URL" -c "$SQL_COMMANDS"

echo ""
echo -e "${GREEN}✅ Authentication data cleanup complete!${NC}"
echo ""
echo -e "${BLUE}📊 All tables should now show 0 remaining records above.${NC}"
echo ""
