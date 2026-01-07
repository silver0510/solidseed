# Korella CRM

Modern CRM platform designed for real estate professionals (realtors, agents, and loan officers).

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
```

## Documentation

See `.claude/` directory for:

- PRDs (Product Requirements Documents)
- Epics (Technical implementation plans)
- Context documentation
- Project management files

## License

Proprietary - All rights reserved
