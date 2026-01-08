# Load Testing Guide

## Overview

This directory contains load testing configurations for the authentication system using Artillery.

## Prerequisites

```bash
# Install Artillery globally
npm install -g artillery

# Or use locally
npm install --save-dev artillery
```

## Setup

### 1. Prepare Test Environment

```bash
# Ensure test server is running
npm run dev

# Or use staging environment
export TARGET_URL=https://staging.your-domain.com
```

### 2. Create Test User

```bash
# Create a test user for login scenarios
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Load Test User",
    "email": "testuser@example.com",
    "password": "TestPassword123!"
  }'

# Verify email (check test email inbox or use database to set email_verified = true)
```

### 3. Configure Test Data

Edit `load-test-config.yml` to update:
- Target URL
- Test user credentials
- Phase durations and arrival rates

## Running Load Tests

### Basic Load Test

```bash
# Run against localhost
artillery run tests/load/load-test-config.yml

# Run against staging
artillery run tests/load/load-test-config.yml --target https://staging.your-domain.com

# Run with output file
artillery run tests/load/load-test-config.yml --output results.json
```

### Quick Test (Development)

```bash
# Quick test with minimal load
artillery run tests/load/load-test-config.yml --count 10
```

### Full Test (Production-like)

```bash
# Full load test
artillery run tests/load/load-test-config.yml --output production-load-test.json
```

## Understanding Results

### Key Metrics

1. **Response Time**
   - p50: Median response time
   - p95: 95th percentile (target: < 2s)
   - p99: 99th percentile (target: < 3s)

2. **Throughput**
   - Requests per second (RPS)
   - Successful requests vs. errors

3. **Error Rate**
   - Target: < 1% errors
   - HTTP status codes
   - Error types

4. **Virtual Users**
   - Concurrent users simulated
   - User arrival rate

### Sample Output

```
Scenario counts:
  User Registration Flow: 200 (20%)
  User Login Flow: 400 (40%)
  Password Reset Flow: 150 (15%)
  OAuth Flow: 150 (15%)
  Authenticated API Access: 100 (10%)

Codes:
  200: 950 (95%)
  201: 20 (2%)
  400: 15 (1.5%)
  401: 10 (1%)
  429: 5 (0.5%)

Response time:
  min: 45ms
  max: 1850ms
  median: 250ms
  p95: 850ms
  p99: 1450ms

VUsers:
  min: 0
  max: 100
```

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Login Response Time (p95) | < 1.5s | < 2s | ≥ 2s |
| Registration Time (p95) | < 2.5s | < 3s | ≥ 3s |
| OAuth Flow (p95) | < 4s | < 5s | ≥ 5s |
| Error Rate | < 1% | < 5% | ≥ 5% |
| Concurrent Users | 100+ | 50-100 | < 50 |

### Expected Results

**Phase 1: Warm-up (10 users)**
- Response time: < 200ms
- Error rate: 0%
- Throughput: ~50 RPS

**Phase 2: Normal load (50 users)**
- Response time: < 500ms
- Error rate: < 1%
- Throughput: ~200 RPS

**Phase 3: Peak load (100 users)**
- Response time: < 1500ms
- Error rate: < 2%
- Throughput: ~400 RPS

**Phase 4: Stress test (150 users)**
- Response time: < 2000ms
- Error rate: < 5%
- Throughput: ~500 RPS

## Troubleshooting

### High Error Rate

**Symptoms:** > 5% errors

**Possible Causes:**
1. Database connection pool exhausted
2. Rate limiting too aggressive
3. Email service throttling
4. OAuth provider rate limits

**Solutions:**
```bash
# Check database connections
# In Supabase Dashboard: Database > Metrics

# Adjust rate limits
RATE_LIMIT_LOGIN_MAX=20

# Check email service quota
# In Resend Dashboard: Usage
```

### Slow Response Times

**Symptoms:** p95 > 2s

**Possible Causes:**
1. Database query performance
2. Network latency
3. Email service delays
4. External API calls

**Solutions:**
```bash
# Check database query performance
# Enable slow query logging

# Check network latency
ping app.your-domain.com

# Use caching where appropriate
# Redis for frequently accessed data
```

### Memory Issues

**Symptoms:** OOM errors, crashes

**Solutions:**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Check for memory leaks
# Use node --inspect
# Analyze heap snapshots
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Artillery
        run: npm install -g artillery

      - name: Deploy to staging
        run: # Deploy script

      - name: Run load tests
        run: artillery run tests/load/load-test-config.yml --output results.json

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json

      - name: Check thresholds
        run: |
          # Parse results and fail if thresholds exceeded
          node scripts/check-load-thresholds.js results.json
```

## Best Practices

1. **Test Early and Often**
   - Run load tests in CI/CD
   - Test before each release
   - Monitor performance trends

2. **Use Realistic Data**
   - Simulate real user behavior
   - Use production-like data volumes
   - Include think time between requests

3. **Monitor During Tests**
   - Watch database metrics
   - Monitor server resources
   - Track error rates in real-time

4. **Iterate and Improve**
   - Identify bottlenecks
   - Optimize slow endpoints
   - Re-test after changes

5. **Document Results**
   - Save test results
   - Track performance over time
   - Share findings with team

## Additional Resources

- [Artillery Documentation](https://artillery.io/docs/)
- [Performance Testing Best Practices](https://artillery.io/blog/guides/performance-testing-best-practices/)
- [Load Testing Patterns](https://artillery.io/docs/guides/guides/performance-testing-patterns)

## Contact

For questions or issues, contact:
- DevOps Team: devops@korella.com
- Performance Lead: perf@korella.com
