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
