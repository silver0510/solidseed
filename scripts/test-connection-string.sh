#!/bin/bash

# Test Database Connection String
# Usage: ./scripts/test-connection-string.sh "postgresql://..."

if [ -z "$1" ]; then
  echo "Usage: ./scripts/test-connection-string.sh \"postgresql://user:pass@host:port/db\""
  echo ""
  echo "This script tests if a PostgreSQL connection string works."
  exit 1
fi

CONNECTION_STRING="$1"

# Extract hostname and port
HOST=$(echo "$CONNECTION_STRING" | sed -n 's|.*@\([^:]*\):[0-9]*.*|\1|p')
PORT=$(echo "$CONNECTION_STRING" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

echo "🔍 Testing connection string..."
echo ""
echo "Host: $HOST"
echo "Port: $PORT"
echo ""

# Test DNS resolution
echo "1️⃣  Testing DNS resolution..."
if nslookup "$HOST" > /dev/null 2>&1; then
  echo "   ✓ DNS resolution successful"
  echo ""
else
  echo "   ✗ DNS resolution failed - hostname does not exist!"
  echo ""
  echo "❌ The hostname '$HOST' cannot be resolved."
  echo "   Please check your Supabase project and get the correct connection string."
  exit 1
fi

# Test port connectivity
echo "2️⃣  Testing port connectivity..."
if nc -z -w 5 "$HOST" "$PORT" 2>/dev/null; then
  echo "   ✓ Port $PORT is open and accessible"
  echo ""
else
  echo "   ✗ Cannot connect to port $PORT"
  echo ""
  echo "❌ The port is not accessible. Possible reasons:"
  echo "   - Firewall blocking the connection"
  echo "   - Database server is down"
  echo "   - Wrong port number"
  exit 1
fi

# Test actual database connection
echo "3️⃣  Testing database connection..."
if command -v psql > /dev/null 2>&1; then
  if psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "   ✓ Database connection successful!"
    echo ""
    echo "✅ All tests passed! This connection string works."
  else
    echo "   ✗ Database connection failed"
    echo ""
    echo "❌ Could not connect to database. Check:"
    echo "   - Username and password are correct"
    echo "   - Database name is correct"
    echo "   - User has necessary permissions"
  fi
else
  echo "   ⚠️  psql not installed, skipping database test"
  echo ""
  echo "✅ DNS and port tests passed!"
  echo "   Install PostgreSQL client to test the full connection:"
  echo "   brew install postgresql"
fi
