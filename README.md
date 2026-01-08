# Korella CRM

Modern CRM platform designed for real estate professionals (realtors, agents, and loan officers).

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-username/korella.git
cd korella

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Configure environment variables
# Edit .env.local with your credentials (see Setup Guide below)

# 5. Start development server
npm run dev

# 6. Run integration tests
./scripts/integration-test.sh
```

## Project Status

🚧 **In Development** - Project setup phase

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **State**: TanStack Query v5, Zustand
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Better Auth (OAuth + Email/Password)
- **Email**: Resend (transactional)
- **Monitoring**: Sentry
- **Deployment**: Vercel

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## OAuth Setup

### Google OAuth Setup

#### Development Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click "Select a project" → "New Project"
   - Project name: "Korella CRM"
   - Click "Create"

2. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable:
     - "Google People API" (for user profile data)

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External** (for development/testing)
   - App name: `Korella CRM`
   - User support email: your-email@example.com
   - Scopes: Add the following:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Test users: Add your email and any test user emails

4. **Create OAuth Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Name: `Korella CRM - Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:3001`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3001/api/auth/callback/google`
   - Click "Create" and copy the Client ID and Client Secret

5. **Add Credentials to .env.local**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
   ```

#### Production Setup

1. **Update OAuth Consent Screen**
   - Add production URLs:
     - Homepage: `https://korella.app`
     - Privacy policy: `https://korella.app/privacy`
     - Terms of service: `https://korella.app/terms`

2. **Update Redirect URIs**
   - Add production URIs:
     - `https://korella.app/api/auth/callback/google`
     - `https://www.korella.app/api/auth/callback/google`

3. **Submit for Verification** (if External user type)
   - Required for production use with External user type
   - Submit app for Google verification with app details and privacy policy

#### Redirect URI Format

Better Auth expects redirect URIs in this format:
```
{APP_URL}/api/auth/callback/google
```

Where `APP_URL` is:
- Development: `http://localhost:3000`
- Production: `https://korella.app`

#### Testing OAuth Flow

1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/auth/signin`
3. Click "Sign in with Google"
4. You should see the Google OAuth consent screen
5. After consent, you'll be redirected back to the app

#### Troubleshooting

**Error: "redirect_uri_mismatch"**
- Ensure redirect URI in Google Console exactly matches Better Auth callback URL
- Check for trailing slashes (should not have one)
- Verify APP_URL environment variable is correct

**Error: "Access blocked: This app's request is invalid"**
- OAuth consent screen not configured properly
- Missing required scopes (email, profile, openid)

**Error: "This app isn't verified"**
- Normal for development with External user type
- Add test users in OAuth consent screen
- Or submit app for verification for production

## Email Service Setup (Resend)

### Development Setup

1. **Create Resend Account**
   - Go to [resend.com/signup](https://resend.com/signup)
   - Sign up with your email and verify your account

2. **Create API Key**
   - Go to "API Keys" section
   - Click "Create API Key"
   - Name: "Korella CRM - Development"
   - Copy the API key (starts with `re_`)

3. **Add to Environment Variables**
   ```bash
   RESEND_API_KEY=re_your_api_key
   ```

4. **For Development**
   - Use `onboarding@resend.dev` as the from address
   - No domain setup required for testing

### Production Setup

1. **Add Your Domain**
   - Go to "Domains" in Resend dashboard
   - Click "Add Domain"
   - Enter your domain: `korella.app`

2. **Configure DNS Records**
   - Add the following DNS records to your domain:
     - **MX Record**: For receiving bounces
     - **TXT Record**: For SPF authentication
     - **CNAME Records**: For DKIM authentication

3. **Verify Domain**
   - Wait for DNS propagation (can take up to 48 hours)
   - Click "Verify" in Resend dashboard

4. **Update Environment Variable**
   ```bash
   RESEND_FROM_EMAIL=noreply@korella.app
   ```

### Testing Email Service

```bash
# Test generic email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'

# Test verification email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","type":"verification"}'

# Test password reset email
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","type":"password-reset"}'
```

### Troubleshooting

**Email not received:**
- Check spam folder
- Verify from address (use `onboarding@resend.dev` for development)
- Check Resend dashboard for delivery status

**Invalid API key error:**
- Verify API key starts with `re_`
- Check for extra spaces in `.env.local`
- Create a new API key if needed

## Error Monitoring Setup (Sentry)

### Development Setup

1. **Create Sentry Account**
   - Go to [sentry.io/signup](https://sentry.io/signup)
   - Sign up or log in with your account

2. **Create New Project**
   - Click "Projects" → "Create Project"
   - Platform: **Next.js**
   - Project name: `korella-crm`
   - Alert frequency: Choose your preference

3. **Copy DSN**
   - After project creation, copy the DSN
   - Format: `https://key@org.ingest.sentry.io/project-id`

4. **Add to Environment Variables**
   ```bash
   SENTRY_DSN=https://key@org.ingest.sentry.io/project-id
   NEXT_PUBLIC_SENTRY_DSN=https://key@org.ingest.sentry.io/project-id
   SENTRY_AUTH_TOKEN=your_auth_token
   ```

5. **Configuration Files**
   - `instrumentation.ts` - Loads Sentry based on runtime
   - `sentry.server.config.ts` - Server-side error tracking
   - `sentry.client.config.ts` - Client-side error tracking + session replay
   - `sentry.edge.config.ts` - Edge runtime error tracking

### Features Configured

- **Error Tracking**: Automatic capture of all errors
- **Performance Monitoring**: 10% trace sampling in production
- **Session Replay**: Browser session recording on errors
- **Privacy Protection**: Sensitive data filtered (auth headers, cookies)
- **Source Maps**: Uploaded for production debugging
- **Release Tracking**: Linked to Git commits

### Testing Sentry

```bash
# Test error tracking
curl http://localhost:3000/api/test/email

# Expected response:
# {
#   "success": true,
#   "message": "Test error sent to Sentry"
# }

# Check Sentry dashboard for captured error
# https://sentry.io/organizations/YOUR_ORG/issues/
```

### Production Configuration

In production, Sentry will:
- Only send errors when `NODE_ENV=production`
- Sample 10% of traces (configurable in config files)
- Upload source maps automatically via Vercel integration
- Track releases using Git commit SHA

### Troubleshooting

**Errors not appearing in Sentry:**
- Check that `SENTRY_DSN` is set correctly
- Verify Sentry is enabled (check `enabled` config)
- Restart development server

**"Module not found: instrumentation":**
- Next.js 15+ has instrumentation enabled by default
- Ensure `instrumentation.ts` is in project root
- Restart dev server

## Vercel Deployment

### Prerequisites

- Vercel account (sign up at vercel.com)
- Vercel CLI installed: `npm install -g vercel`
- Project linked: `vercel link`

### Development with Vercel

```bash
# Start local dev server with Vercel features
vercel dev

# This provides:
# - Environment variables from Vercel
# - Serverless function simulation
# - Edge function testing
```

### Deployment Process

#### First Time Setup

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Authenticate**

   ```bash
   vercel login
   ```

3. **Link Project**

   ```bash
   vercel link
   # Follow prompts to create/link project
   ```

4. **Configure Environment Variables**

   ```bash
   # Add production environment variables
   vercel env add DATABASE_URL production
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_ANON_KEY production
   vercel env add GOOGLE_CLIENT_ID production
   vercel env add GOOGLE_CLIENT_SECRET production
   vercel env add RESEND_API_KEY production
   vercel env add SENTRY_DSN production
   vercel env add NEXT_PUBLIC_SENTRY_DSN production
   vercel env add JWT_SECRET production
   vercel env add APP_URL production

   # Set APP_URL to: https://korella.app
   ```

#### Deploy to Preview

```bash
# Deploy to preview environment
vercel

# This creates a preview deployment with unique URL
# Perfect for testing before production
```

#### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use GitHub integration for automatic deployments:
# 1. Go to vercel.com/dashboard
# 2. Import Git Repository
# 3. Connect to GitHub repo
# 4. Configure build settings
# 5. Add environment variables
# 6. Every push to main = automatic production deployment
# 7. Every PR = preview deployment
```

### Vercel Configuration

Project settings are in `vercel.json`:

- Framework: Next.js
- Region: Washington D.C. (iad1) - Closest to US East Coast
- Build command: `npm run build`
- Install command: `npm install`
- Output directory: `.next` (automatic)

### Environment Variables

**Production variables** (set in Vercel dashboard or CLI):

- All variables from `.env.local`
- `APP_URL` = `https://korella.app`
- `NODE_ENV` = `production` (automatic)

**Preview variables** (optional):

- Same as production, but with preview URLs
- Use preview database/services if needed

### Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied to production database
- [ ] Supabase production project configured
- [ ] OAuth redirect URIs updated for production domain
- [ ] Domain configured in Vercel (korella.app)
- [ ] DNS records pointed to Vercel
- [ ] SSL certificate verified
- [ ] Sentry configured for production
- [ ] Error monitoring tested
- [ ] Performance monitoring enabled
- [ ] Build successful locally: `npm run build`
- [ ] Type check passing: `npm run type-check`
- [ ] Tests passing: `npm run test`

### Post-Deployment

1. **Verify deployment**

   ```bash
   vercel ls
   # Check deployment status
   ```

2. **Check logs**

   ```bash
   vercel logs
   # View production logs
   ```

3. **Test production site**
   - Visit https://korella.app
   - Test authentication flow
   - Test database connectivity
   - Verify OAuth works
   - Check Sentry error tracking

### Rollback

If something goes wrong:

```bash
# List deployments
vercel ls

# Promote previous deployment to production
vercel promote <deployment-url>
```

### Useful Commands

```bash
# View project info
vercel inspect

# View logs
vercel logs [deployment-url]

# List all deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]

# Pull environment variables to local
vercel env pull .env.local
```

### GitHub Integration (Recommended)

For automatic deployments:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import Git Repository
3. Select GitHub repository
4. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Install Command: `npm install`
5. Add environment variables
6. Deploy

**Automatic Deployments:**

- Push to `main` → Production deployment
- Open PR → Preview deployment
- Commit to PR → Updated preview

### Troubleshooting

**Build fails on Vercel but works locally**

- Check Node.js version matches (use `.nvmrc`)
- Verify all dependencies in `package.json`
- Check environment variables are set
- Review build logs in Vercel dashboard

**Environment variables not loading**

- Ensure variables are set for correct environment (production/preview)
- Restart deployment after adding variables
- Check variable names match exactly

**Domain not working**

- Verify DNS records point to Vercel
- Check domain configuration in Vercel dashboard
- Wait for DNS propagation (up to 48 hours)

**Serverless function timeout**

- Default timeout: 10s (Hobby), 60s (Pro)
- Optimize slow functions
- Consider upgrading plan if needed

## Verification

### Health Check

```bash
# Start server
npm run dev

# Check health
curl http://localhost:3000/api/health | jq

# Expected: All services "healthy"
```

### Integration Tests

```bash
# Run automated tests
./scripts/integration-test.sh

# Expected: All tests pass
```

### Manual Testing

See [TESTING.md](./TESTING.md) for complete manual testing checklist.

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Environment Variables

All environment variables are documented in `.env.example`.

Required variables:
- `SUPABASE_URL` - From Supabase dashboard
- `SUPABASE_ANON_KEY` - From Supabase dashboard
- `SUPABASE_DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `RESEND_API_KEY` - From Resend dashboard
- `JWT_SECRET` - Generate random 32+ character string

Optional variables:
- `SENTRY_DSN` - For error monitoring
- `NEXT_PUBLIC_SENTRY_DSN` - For client-side monitoring

## Project Structure

```
app/
├── (auth)/          # Public authentication pages
├── (dashboard)/     # Protected application pages
└── api/             # API routes

lib/                 # Utility functions and configurations
features/            # Feature-based modules
components/          # Reusable UI components
supabase/            # Database migrations
tests/               # Test files
scripts/             # Utility scripts
```

## Documentation

See `.claude/` directory for:

- PRDs (Product Requirements Documents)
- Epics (Technical implementation plans)
- Context documentation
- Project management files

Additional documentation:
- [TESTING.md](./TESTING.md) - Manual testing checklist
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

## License

Proprietary - All rights reserved
