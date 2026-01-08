#!/bin/bash

echo "🏥 Running health check..."

# Make request to health endpoint
RESPONSE=$(curl -s http://localhost:3000/api/health)

# Parse response
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" = "healthy" ]; then
  echo "✅ All services healthy"
  echo $RESPONSE | jq
  exit 0
elif [ "$STATUS" = "degraded" ]; then
  echo "⚠️  Some services degraded"
  echo $RESPONSE | jq
  exit 0
else
  echo "❌ Services unhealthy"
  echo $RESPONSE | jq
  exit 1
fi
