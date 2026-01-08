# Production Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-08
**Epic:** User Authentication System (Task 010)

---

## Executive Summary

This guide provides step-by-step instructions for deploying the Korella Authentication System to production. It covers infrastructure setup, security configuration, monitoring, and post-deployment verification.

**Estimated Time:** 2-3 hours
**Difficulty:** Intermediate
**Prerequisites:** DevOps experience, basic security knowledge

---

## Pre-Deployment Checklist

### Infrastructure Readiness

- [ ] Hosting platform account (Vercel/AWS/GCP/Azure)
- [ ] Supabase project created and configured
- [ ] Domain name purchased and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt or commercial)
- [ ] Email service account (Resend/SendGrid)
- [ ] OAuth provider accounts (Google Cloud, Microsoft Azure)
- [ ] Monitoring service (Sentry/DataDog/New Relic)

### Security Preparation

- [ ] JWT secrets generated (256+ bits)
- [ ] OAuth client secrets generated
- [ ] Email service API keys obtained
- [ ] Database credentials secured
- [ ] Environment variables documented
- [ ] Security review completed

### Testing Completed

- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Load tests completed (100+ concurrent users)
- [ ] Security audit passed (OWASP checklist)
- [ ] Penetration testing completed
- [ ] Performance benchmarks met

---

## Step 1: Infrastructure Setup

### 1.1 Supabase Configuration

```bash
# 1. Create Supabase project
# Go to: https://app.supabase.com
# Click: New Project
# Fill in:
# - Name: korella-production
# - Database Password: [generate strong password]
# - Region: [select closest to users]

# 2. Note connection details
# Project URL: https://xxxxxxxxxxxxx.supabase.co
# Anon Key:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Database URL: postgresql://postgres:[password]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# 3. Enable database extensions
# In Supabase Dashboard: Database > Extensions
# Enable: pg_stat_statements (for monitoring)

# 4. Configure connection pooling
# Settings > Database > Connection Pooling
# Mode: Transaction
# Pool Size: 15 (default)
```

### 1.2 DNS Configuration

```bash
# 1. Add DNS records for your domain
# In your DNS provider (GoDaddy/Namecheap/Cloudflare):

# A record for app
app.your-domain.com A 76.76.21.21 (Vercel)

# CNAME for www (optional)
www.your-domain.com CNAME app.your-domain.com

# 2. Verify DNS propagation
dig app.your-domain.com
nslookup app.your-domain.com

# 3. Wait for DNS to propagate (can take 24-48 hours)
# Use: https://www.whatsmydns.net/ to check globally
```

### 1.3 SSL Certificate

```bash
# Option 1: Vercel (automatic)
# SSL is automatically provisioned by Vercel
# No action needed

# Option 2: Let's Encrypt (manual)
certbot certonly --standalone -d app.your-domain.com

# Option 3: Commercial certificate
# Purchase from DigiCert, Comodo, etc.
# Upload to hosting platform
```

---

## Step 2: Application Configuration

### 2.1 Environment Variables

Create production environment file:

```bash
# On Vercel: Dashboard > Settings > Environment Variables
# Add the following:

# Application
NODE_ENV=production
BETTER_AUTH_URL=https://app.your-domain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# JWT (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=[your-256-bit-secret]

# OAuth - Google
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=xxxxxxxxxx-xxxxxx-xxxxxx-xxxxxx
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxx

# Email - Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@your-domain.com

# Optional: Redis (if using distributed rate limiting)
REDIS_URL=redis://your-redis-instance:6379

# Optional: Sentry
SENTRY_DSN=https://xxxxxxxxxx@xxxx.ingest.sentry.io/xxxxxx
```

### 2.2 OAuth Provider Setup

#### Google OAuth

```bash
# 1. Go to: https://console.cloud.google.com
# 2. Select project or create new
# 3. Navigate: APIs & Services > Credentials
# 4. Create OAuth 2.0 Client ID
#    - Application type: Web application
#    - Name: Korella Production
# 5. Add authorized redirect URIs:
#    https://app.your-domain.com/api/auth/callback/google
# 6. Copy Client ID and Client Secret
# 7. Add to environment variables
```

#### Microsoft OAuth

```bash
# 1. Go to: https://portal.azure.com
# 2. Navigate: Azure Active Directory > App registrations
# 3. New registration:
#    - Name: Korella Production
#    - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
#    - Redirect URI: Web > https://app.your-domain.com/api/auth/callback/microsoft
# 4. Register application
# 5. Go to: Certificates & secrets > New client secret
# 6. Copy:
#    - Application (client) ID
#    - Client secret value
# 7. Add to environment variables
# 8. Configure API permissions:
#    - User.Read (email, profile)
```

---

## Step 3: Database Deployment

### 3.1 Run Migrations

```bash
# Option 1: Using Supabase Dashboard
# 1. Go to: https://app.supabase.com
# 2. Select project
# 3. Navigate: SQL Editor > New Query
# 4. Copy migration SQL from: supabase/migrations/
# 5. Run each migration in order:
#    - 20260106_create_users_table.sql
#    - 20260106_create_oauth_providers_table.sql
#    - 20260106_create_password_resets_table.sql
#    - 20260106_create_email_verifications_table.sql
#    - 20260106_create_auth_logs_table.sql

# Option 2: Using Supabase CLI
supabase link --project-ref xxxxxxxxxxxxxx
supabase db push

# Option 3: Using psql
psql $SUPABASE_DATABASE_URL < supabase/migrations/*.sql
```

### 3.2 Verify Database Schema

```sql
-- Run in Supabase SQL Editor

-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected output:
-- users
-- oauth_providers
-- password_resets
-- email_verifications
-- auth_logs

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 3.3 Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);
```

---

## Step 4: Application Deployment

### 4.1 Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
cd /path/to/korella
vercel link

# 4. Deploy to preview (staging)
vercel

# 5. Test staging environment
# Run smoke tests against staging URL

# 6. Deploy to production
vercel --prod

# 7. Verify deployment
curl https://app.your-domain.com/api/health
```

### 4.2 Configure Vercel Settings

```bash
# In Vercel Dashboard:

# 1. Set environment variables
# Settings > Environment Variables
# Add all variables from Step 2.1

# 2. Configure domains
# Settings > Domains
# Add: app.your-domain.com

# 3. Enable HTTPS
# Automatically enabled by Vercel

# 4. Configure build settings
# Settings > General
# Build Command: npm run build
# Output Directory: .next
# Install Command: npm install

# 5. Configure deployment protection
# Settings > Git
# Enable: Deploy Previews (for PR testing)
# Enable: Production Branch (main)
```

---

## Step 5: Post-Deployment Verification

### 5.1 Health Checks

```bash
# 1. Basic health check
curl https://app.your-domain.com/api/health

# Expected output:
# {"status":"ok","timestamp":"2026-01-08T12:00:00Z"}

# 2. Database health check
curl https://app.your-domain.com/api/health/db

# Expected output:
# {"status":"ok","database":"connected"}

# 3. Detailed health check
curl https://app.your-domain.com/api/health/detailed

# Expected output:
# {
#   "status":"ok",
#   "timestamp":"2026-01-08T12:00:00Z",
#   "database":"connected",
#   "redis":"connected",
#   "email_service":"operational"
# }
```

### 5.2 Smoke Tests

```bash
# Test 1: User Registration
curl -X POST https://app.your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Production Test User",
    "email": "prod-test@example.com",
    "password": "TestPassword123!"
  }'

# Expected: 200/201 with message about email verification

# Test 2: OAuth Initiation
curl -I https://app.your-domain.com/api/auth/oauth/google

# Expected: 302 redirect to Google

# Test 3: Protected Endpoint (should fail without auth)
curl https://app.your-domain.com/api/auth/me

# Expected: 401 Unauthorized
```

### 5.3 Email Verification

```bash
# 1. Register a test user
# 2. Check email inbox (and spam folder)
# 3. Click verification link
# 4. Verify account activated
# 5. Attempt login with verified credentials
```

### 5.4 OAuth Flow Testing

```bash
# 1. Visit: https://app.your-domain.com/api/auth/oauth/google
# 2. Sign in to Google
# 3. Approve permissions
# 4. Verify redirect back to app
# 5. Check user session created
# 6. Verify user data correct

# Repeat for Microsoft OAuth
```

### 5.5 Load Testing

```bash
# Run load tests against production
artillery run tests/load/load-test-config.yml \
  --target https://app.your-domain.com \
  --output production-load-results.json

# Verify:
# - Response times < 2s (p95)
# - Error rate < 1%
# - 100+ concurrent users handled
```

---

## Step 6: Monitoring Setup

### 6.1 Error Tracking (Sentry)

```bash
# 1. Create Sentry account
# https://sentry.io

# 2. Create new project
# Framework: Next.js
# Name: korella-production

# 3. Install Sentry SDK
npm install @sentry/nextjs

# 4. Configure Sentry
# In sentry.client.config.ts and sentry.server.config.ts:
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
});

# 5. Test error tracking
# Trigger test error from app
# Verify appears in Sentry dashboard
```

### 6.2 Performance Monitoring

```bash
# Option 1: Vercel Analytics
# Automatically enabled for Vercel deployments
# View in: Vercel Dashboard > Analytics

# Option 2: New Relic
# 1. Create account: https://newrelic.com
# 2. Install agent:
npm install newrelic
# 3. Configure: newrelic.js
# 4. Deploy with agent

# Option 3: DataDog
# 1. Create account: https://www.datadoghq.com
# 2. Install agent
# 3. Configure APM
```

### 6.3 Uptime Monitoring

```bash
# Option 1: UptimeRobot (free)
# 1. Create account: https://uptimerobot.com
# 2. Add monitor:
#    - Type: HTTPS
#    - URL: https://app.your-domain.com/api/health
#    - Interval: 5 minutes
#    - Alert: Email + Slack

# Option 2: Pingdom (paid)
# Similar setup

# Option 3: AWS CloudWatch (if using AWS)
# Create CloudWatch alarm for health endpoint
```

---

## Step 7: Security Hardening

### 7.1 Security Headers

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};
```

### 7.2 Content Security Policy

```javascript
// In next.config.js
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://accounts.google.com https://login.microsoftonline.com",
    "frame-src 'self' https://accounts.google.com",
  ].join('; ')
}
```

### 7.3 Rate Limiting

```bash
# Configure rate limits for production

# Login: 10 attempts per minute per IP
RATE_LIMIT_LOGIN_MAX=10
RATE_LIMIT_LOGIN_WINDOW=60

# Password reset: 3 attempts per hour per email
RATE_LIMIT_RESET_MAX=3
RATE_LIMIT_RESET_WINDOW=3600

# Registration: 5 attempts per hour per IP
RATE_LIMIT_REGISTER_MAX=5
RATE_LIMIT_REGISTER_WINDOW=3600
```

---

## Step 8: Backup and Recovery

### 8.1 Database Backups

```bash
# Supabase automatic backups:
# - Daily backups retained for 7 days
# - Point-in-time recovery for 7 days

# Manual backup:
# In Supabase Dashboard: Database > Backups > Create Backup

# Scheduled backups:
# Use Supabase CLI or API to schedule
```

### 8.2 Disaster Recovery Plan

```markdown
## Disaster Recovery Procedures

### Scenario 1: Database Failure
1. Detect failure via monitoring
2. Restore from latest backup
3. Verify data integrity
4. Update application connection string
5. Test all authentication flows
6. Monitor for errors

### Scenario 2: Application Server Failure
1. Detect failure via uptime monitoring
3. Deploy to backup region
4. Update DNS to point to backup
5. Verify all systems operational
6. Monitor performance

### Scenario 3: Security Breach
1. Immediately revoke all JWT tokens
2. Force password reset for all users
3. Rotate all secrets (JWT, OAuth, API keys)
4. Review audit logs
5. Identify and patch vulnerability
6. Notify affected users
7. Document lessons learned
```

---

## Step 9: Documentation and Handoff

### 9.1 Update Documentation

```bash
# 1. Update deployment documentation
# 2. Document any custom configurations
# 3. Create runbook for common operations
# 4. Document troubleshooting procedures
```

### 9.2 Team Training

```markdown
## Training Checklist

### Development Team
- [ ] Local development setup
- [ ] Testing procedures
- [ ] Deployment process
- [ ] Debugging techniques

### Operations Team
- [ ] Monitoring dashboards
- [ ] Alert response procedures
- [ ] Backup and restore procedures
- [ ] Security incident response

### Support Team
- [ ] Common user issues
- [ ] Troubleshooting guide
- [ ] Escalation procedures
```

---

## Step 10: Go-Live Checklist

### Final Verification

- [ ] All health checks passing
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] OAuth providers working
- [ ] Email delivery verified
- [ ] SSL certificate valid
- [ ] DNS propagated globally
- [ ] Monitoring configured
- [ ] Alerts configured
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] Team trained
- [ ] Documentation updated

### Go-Live Decision

```markdown
## Go/No-Go Decision

### Criteria for Go
- All critical tests passing
- No P0/P1 issues outstanding
- Performance benchmarks met
- Security audit passed
- Monitoring operational
- Team ready for support

### Approved By
- Tech Lead: _______________ Date: ______
- DevOps Lead: _______________ Date: ______
- Security Lead: _______________ Date: ______
- Product Manager: _______________ Date: ______
```

---

## Post-Live Support

### Day 1 Activities

- [ ] Monitor error rates (hourly)
- [ ] Check authentication success rates
- [ ] Verify email delivery
- [ ] Review security logs
- [ ] Address user issues promptly

### Week 1 Activities

- [ ] Daily performance review
- [ ] Weekly security review
- [ ] Analyze user feedback
- [ ] Address any issues
- [ ] Plan improvements

### Month 1 Activities

- [ ] Monthly performance review
- [ ] Security audit
- [ ] Capacity planning
- [ ] User experience analysis
- [ ] Roadmap updates

---

## Support Contacts

```markdown
### Technical Support
- DevOps: devops@korella.com
- Security: security@korella.com
- Database: dba@korella.com

### External Support
- Supabase: https://supabase.com/support
- Vercel: https://vercel.com/support
- Sentry: https://sentry.io/support/
- Resend: https://resend.com/support
```

---

**Document Owner:** DevOps Team
**Last Updated:** 2026-01-08
**Next Review:** 2026-02-08

**Change Log:**
- 2026-01-08: Initial production deployment guide created
