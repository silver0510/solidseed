# Authentication System Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-08
**Epic:** User Authentication System (Task 010)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [OAuth Provider Setup](#oauth-provider-setup)
5. [Email Service Setup](#email-service-setup)
6. [Deployment Steps](#deployment-steps)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Rollback Plan](#rollback-plan)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts and Services

1. **Supabase Account**
   - Sign up at https://app.supabase.com
   - Create a new project
   - Note your project URL and anon key

2. **Google Cloud Platform** (for Google OAuth)
   - Sign up at https://console.cloud.google.com
   - Create a new project or use existing
   - Enable Google+ API

3. **Microsoft Azure** (for Microsoft OAuth)
   - Sign up at https://portal.azure.com
   - Access Azure Active Directory

4. **Resend** (for email service)
   - Sign up at https://resend.com
   - Verify your domain
   - Generate API key

5. **Vercel** (for hosting) or equivalent
   - Sign up at https://vercel.com
   - Connect your GitHub repository

### Local Development Tools

```bash
# Required tools
node >= 18.x
npm >= 9.x
git
supabase CLI (optional, for local development)

# Install Supabase CLI
npm install -g supabase
```

---

## Environment Configuration

### Step 1: Copy Environment Template

```bash
cp .env.example .env.local
```

### Step 2: Configure Environment Variables

Edit `.env.local` and fill in all required values:

#### Application Settings

```bash
NODE_ENV=production
BETTER_AUTH_URL=https://your-domain.com
```

#### Supabase Configuration

```bash
# Get these from: https://app.supabase.com > Your Project > Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

#### JWT Secret

```bash
# Generate secure JWT secret
# Run: openssl rand -base64 32
BETTER_AUTH_SECRET=your-generated-256-bit-secret
```

#### OAuth - Google

```bash
# Setup: https://console.cloud.google.com > APIs & Services > Credentials
# Create OAuth 2.0 Client ID (Web application)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Add these redirect URIs in Google Console:
# Development: http://localhost:3000/api/auth/callback/google
# Production: https://your-domain.com/api/auth/callback/google
```

#### OAuth - Microsoft

```bash
# Setup: https://portal.azure.com > Azure Active Directory > App registrations
# New registration > Web > Redirect URIs
MICROSOFT_CLIENT_ID=your-application-id
MICROSOFT_CLIENT_SECRET=your-client-secret-value

# Add these redirect URIs in Azure Portal:
# Development: http://localhost:3000/api/auth/callback/microsoft
# Production: https://your-domain.com/api/auth/callback/microsoft
```

#### Email Service (Resend)

```bash
# Get API key from: https://resend.com/api-keys
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Use test sender for development
# Use verified domain for production
RESEND_FROM_EMAIL=noreply@your-domain.com
```

#### Optional: Redis (for distributed rate limiting)

```bash
# If not set, falls back to in-memory rate limiting
REDIS_URL=redis://localhost:6379
```

#### Optional: Sentry (for error tracking)

```bash
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Step 3: Verify Configuration

```bash
# Validate environment variables
npm run validate-env

# Check for missing variables
node -e "require('dotenv').config(); console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);"
```

---

## Database Setup

### Step 1: Initialize Supabase Project

1. Go to https://app.supabase.com
2. Create new project
3. Wait for provisioning (~2 minutes)
4. Go to Settings > Database

### Step 2: Run Database Migrations

```bash
# Option A: Using Supabase Dashboard
# Go to SQL Editor > New Query > Paste migration SQL > Run

# Option B: Using Supabase CLI (recommended for production)
supabase link --project-ref your-project-id
supabase db push

# Option C: Using direct connection
psql $SUPABASE_DATABASE_URL < supabase/migrations/20260106_*.sql
```

### Step 3: Verify Tables Created

Run in Supabase SQL Editor:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables:
-- users
-- oauth_providers
-- password_resets
-- email_verifications
-- auth_logs
```

### Step 4: Configure Database Security

```sql
-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Create security policies (example)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);
```

---

## OAuth Provider Setup

### Google OAuth Setup

1. **Create OAuth Client**

   ```bash
   # Go to: https://console.cloud.google.com
   # Select: APIs & Services > Credentials
   # Click: Create Credentials > OAuth client ID
   # Type: Web application
   ```

2. **Configure Redirect URIs**

   ```
   Development:
   - http://localhost:3000/api/auth/callback/google

   Staging:
   - https://staging.your-domain.com/api/auth/callback/google

   Production:
   - https://app.your-domain.com/api/auth/callback/google
   ```

3. **Copy Credentials**

   ```bash
   # Client ID: xxxxx.apps.googleusercontent.com
   # Client Secret: GOCSPX-xxxxx
   ```

4. **Enable Required APIs**

   ```
   - Google+ API
   - Google Identity Services API
   ```

### Microsoft OAuth Setup

1. **Register Application**

   ```bash
   # Go to: https://portal.azure.com
   # Navigate: Azure Active Directory > App registrations
   # Click: New registration
   ```

2. **Configure Redirect URIs**

   ```
   Platform: Web
   Redirect URIs:
   - http://localhost:3000/api/auth/callback/microsoft
   - https://app.your-domain.com/api/auth/callback/microsoft
   ```

3. **Generate Client Secret**

   ```bash
   # Go to: Certificates & secrets > New client secret
   # Copy: Secret value (not secret ID)
   ```

4. **Configure API Permissions**

   ```
   - email (User.Read)
   - profile (User.Read)
   - openid (User.Read)
   ```

5. **Copy Credentials**

   ```bash
   # Application (client) ID: xxxxx-xxxxx-xxxxx
   # Directory (tenant) ID: common
   # Client secret: xxxxxxxxx
   ```

---

## Email Service Setup

### Resend Setup

1. **Create Account**

   ```bash
   # Go to: https://resend.com
   # Sign up for account
   ```

2. **Verify Domain**

   ```bash
   # Go to: https://resend.com/domains
   # Click: Add domain
   # Enter: your-domain.com
   # Add DNS records (SPF, DKIM)
   ```

3. **Generate API Key**

   ```bash
   # Go to: https://resend.com/api-keys
   # Click: Create API key
   # Copy: re_xxxxxxxxxxxxx
   ```

4. **Configure Email Templates**

   ```bash
   # In your code, templates are defined in:
   # src/services/email.service.ts

   # Templates:
   # - Email Verification
   # - Password Reset
   # - Password Changed
   # - Account Lockout Alert
   ```

5. **Test Email Delivery**

   ```bash
   # Use test sender for development
   RESEND_FROM_EMAIL=onboarding@resend.dev

   # Switch to verified domain for production
   RESEND_FROM_EMAIL=noreply@your-domain.com
   ```

---

## Deployment Steps

### Option 1: Vercel (Recommended)

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy to Staging

```bash
# Deploy to preview
vercel

# Set environment variables in Vercel Dashboard
# Settings > Environment Variables
```

#### Step 4: Deploy to Production

```bash
# Deploy to production
vercel --prod
```

### Option 2: Docker

#### Step 1: Build Docker Image

```bash
docker build -t solidseed-auth:latest .
```

#### Step 2: Run Container

```bash
docker run -d \
  --name solidseed-auth \
  -p 3000:3000 \
  --env-file .env.local \
  solidseed-auth:latest
```

#### Step 3: Configure Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name app.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 3: Traditional VPS

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Deploy
git clone https://github.com/your-org/solidseed.git
cd solidseed
npm install
npm run build

# Start with PM2
pm2 start npm --name "solidseed" -- start
pm2 save
pm2 startup
```

---

## Post-Deployment Verification

### Step 1: Health Check

```bash
# Check health endpoint
curl https://app.your-domain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-08T12:00:00Z"}
```

### Step 2: Database Connection

```bash
# Test database connection
curl https://app.your-domain.com/api/health/db

# Expected response:
# {"status":"ok","database":"connected"}
```

### Step 3: Test Registration Flow

```bash
# Test user registration
curl -X POST https://app.your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'

# Expected response:
# {"message":"Please check your email to verify your account"}
```

### Step 4: Test OAuth Flows

```bash
# Visit in browser:
# https://app.your-domain.com/api/auth/oauth/google
# https://app.your-domain.com/api/auth/oauth/microsoft

# Verify:
# - Redirects to OAuth provider
# - After auth, redirects back to app
# - User session created
```

### Step 5: Test Email Delivery

```bash
# Register a test user
# Check email inbox (and spam folder)
# Click verification link
# Verify account activated
```

### Step 6: Load Testing

```bash
# Run load tests (see tests/load/load-test.yml)
artillery run tests/load/load-test.yml

# Verify:
# - Response times < 2s (p95)
# - No errors
# - 100+ concurrent users handled
```

### Step 7: Security Verification

```bash
# Run security checklist
# Check OWASP compliance
# Review logs for suspicious activity
```

---

## Monitoring and Logging

### Application Monitoring

#### Sentry Setup

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Configure project
sentry-cli init -D solidseed-auth

# Verify error tracking
# Trigger test error from app
# Check Sentry dashboard
```

#### Metrics to Track

1. **Authentication Metrics**
   - Registration rate
   - Login success rate
   - Failed login rate
   - Account lockouts
   - Password resets

2. **Performance Metrics**
   - Login response time (p50, p95, p99)
   - Registration response time
   - OAuth flow duration
   - Database query performance

3. **Security Metrics**
   - Failed login attempts per IP
   - Rate limit violations
   - Unusual activity patterns
   - OAuth failures

### Logging

#### Application Logs

```bash
# View logs in production
pm2 logs solidseed

# Or with Vercel
vercel logs

# Or with Docker
docker logs -f solidseed-auth
```

#### Database Logs

```bash
# Access via Supabase Dashboard
# Go to: Database > Logs
```

#### Auth Logs (Database)

```sql
-- Query recent authentication events
SELECT
  event_type,
  COUNT(*) as count,
  created_at
FROM auth_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type, created_at
ORDER BY created_at DESC;
```

### Alerts Configuration

#### Critical Alerts

```yaml
# OAuth Provider Down
- name: OAuth Provider Down
  condition: oauth_error_rate > 50%
  duration: 5m
  action: Send Slack + Email alert

# Email Service Failure
- name: Email Service Down
  condition: email_delivery_rate < 90%
  duration: 10m
  action: Send Slack + Email alert

# High Error Rate
- name: High Error Rate
  condition: error_rate > 5%
  duration: 5m
  action: Send Slack + Email + SMS alert
```

#### Warning Alerts

```yaml
# Slow Response Time
- name: Slow Login
  condition: login_response_time_p95 > 3s
  duration: 10m
  action: Send Slack alert

# High Failed Login Rate
- name: Brute Force Attack?
  condition: failed_login_rate > 20%
  duration: 5m
  action: Send Slack alert + Investigate
```

---

## Rollback Plan

### Immediate Rollback (< 5 minutes)

```bash
# Vercel
vercel rollback <deployment-url>

# PM2
pm2 rollback solidseed

# Docker
docker stop solidseed-auth
docker run -d --name solidseed-auth-rollback solidseed-auth:previous-version
```

### Database Rollback

```bash
# Rollback migrations
supabase db rollback --version 20260106_001

# Or manually restore from backup
# In Supabase Dashboard: Database > Backups > Restore
```

### Environment Rollback

```bash
# Restore previous environment variables
# In Vercel Dashboard: Settings > Environment Variables
# Or manually edit .env.local and redeploy
```

### Verification After Rollback

```bash
# Health check
curl https://app.your-domain.com/api/health

# Test authentication flow
curl -X POST https://app.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"oldpassword"}'

# Monitor logs
pm2 logs solidseed --lines 100
```

---

## Troubleshooting

### Common Issues

#### Issue: Database Connection Failed

**Symptoms:**

- Error: "Connection refused"
- Health check fails

**Solutions:**

```bash
# Check Supabase status
curl https://status.supabase.com

# Verify DATABASE_URL
echo $SUPABASE_DATABASE_URL

# Test connection
psql $SUPABASE_DATABASE_URL -c "SELECT 1"
```

#### Issue: OAuth Callback Fails

**Symptoms:**

- Error: "redirect_uri_mismatch"
- OAuth returns error

**Solutions:**

```bash
# Verify redirect URIs in OAuth provider console
# Check APP_URL environment variable
echo $BETTER_AUTH_URL

# Test callback URL manually
curl https://app.your-domain.com/api/auth/callback/google
```

#### Issue: Emails Not Sending

**Symptoms:**

- Users don't receive verification emails
- Resend API errors

**Solutions:**

```bash
# Verify Resend API key
echo $RESEND_API_KEY

# Check domain verification
# Go to: https://resend.com/domains

# Test email sending
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "'$RESEND_FROM_EMAIL'",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

#### Issue: Rate Limiting Too Aggressive

**Symptoms:**

- Legitimate users locked out
- 429 errors

**Solutions:**

```bash
# Adjust rate limits in .env.local
RATE_LIMIT_LOGIN_MAX=20
RATE_LIMIT_LOGIN_WINDOW=60

# Or disable for testing
# RATE_LIMIT_ENABLED=false
```

#### Issue: JWT Token Invalid

**Symptoms:**

- 401 Unauthorized errors
- Users logged out unexpectedly

**Solutions:**

```bash
# Verify JWT_SECRET is consistent
echo $BETTER_AUTH_SECRET | wc -c

# Should be 32+ characters

# Regenerate if needed
openssl rand -base64 32
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=better-auth:* npm run dev

# Verbose error output
NODE_ENV=development npm run dev

# Database query logging
LOG_DB_QUERIES=true npm run dev
```

### Get Help

```bash
# Check logs
pm2 logs solidseed --lines 500

# Database logs in Supabase Dashboard
# Error tracking in Sentry Dashboard
# Performance metrics in monitoring tool

# Documentation:
# https://solidseed.app/docs
# https://better-auth.com/docs
# https://supabase.com/docs
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] OAuth providers configured
- [ ] Email service verified
- [ ] SSL certificate obtained
- [ ] Domain DNS configured
- [ ] Monitoring tools set up
- [ ] Error tracking configured
- [ ] Backup strategy in place
- [ ] Rollback plan documented

### Deployment

- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Test all authentication flows
- [ ] Test email delivery
- [ ] Test OAuth flows
- [ ] Run load tests
- [ ] Review logs for errors
- [ ] Approve for production

### Post-Deployment

- [ ] Deploy to production
- [ ] Run health checks
- [ ] Test critical flows
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Verify email delivery
- [ ] Check OAuth flows
- [ ] Review security logs
- [ ] Document any issues
- [ ] Update runbook

---

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**

- Review error logs
- Check authentication metrics
- Monitor failed login rates

**Weekly:**

- Review security logs
- Check OAuth provider status
- Verify email delivery rates

**Monthly:**

- Review and update dependencies
- Check for security vulnerabilities
- Test disaster recovery
- Review performance metrics
- Update documentation

**Quarterly:**

- Security audit
- Penetration testing
- Performance review
- Capacity planning
- Backup verification

---

**Document Owner:** DevOps Team
**Last Review:** 2026-01-08
**Next Review:** 2026-04-08
