# Better Auth Setup Guide

This guide explains how Better Auth is configured and integrated into Korella CRM.

## Overview

Better Auth is a modern, TypeScript-first authentication framework that provides:

- Email and password authentication
- OAuth social login (Google, Microsoft)
- JWT-based session management
- Email verification
- Password reset functionality
- Rate limiting
- Account security features

## Installation

Better Auth is already installed in the project:

```bash
npm install better-auth @neondatabase/serverless
```

## Configuration Files

### 1. Main Configuration: `src/lib/auth.ts`

This is the core Better Auth configuration file that includes:

- **Database Adapter**: PostgreSQL connection via Neon client
- **Email/Password Auth**: bcrypt hashing (cost 12), complexity rules
- **OAuth Providers**: Google and Microsoft
- **Email Verification**: 24-hour token expiration
- **JWT Sessions**: 3-day default, 30-day with "remember me"
- **Rate Limiting**: 10 login/min, 3 password resets/hr
- **Account Lockout**: 5 failed attempts → 30-minute lock
- **Custom Schema Mapping**: Maps Better Auth to our database schema

### 2. OAuth Configuration: `src/config/oauth.config.ts`

Configures Google and Microsoft OAuth providers:

- Client IDs and secrets
- Redirect URIs
- OAuth scopes (email, profile)
- Profile-to-user field mapping

### 3. Email Service: `src/services/email.service.ts`

Resend integration for sending:

- Email verification emails
- Password reset emails
- Password change confirmations
- Account lockout security alerts

### 4. Middleware: `src/middleware/auth.middleware.ts`

Next.js middleware helpers:

- `betterAuthMiddleware()`: Route protection
- `withAuth()`: API route guard (requires auth)
- `withOptionalAuth()`: API route helper (optional auth)
- `getSessionFromRequest()`: Extract and validate JWT
- `hasRequiredTier()`: Check subscription tier

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-minimum-32-characters

# Database
SUPABASE_DATABASE_URL=postgresql://...

# OAuth - Google
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# OAuth - Microsoft
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret

# Email Service
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## Database Schema

Better Auth is configured to use our custom database schema from Task 001:

- `users` - User accounts with trial and subscription tracking
- `oauth_providers` - OAuth provider links (Google, Microsoft)
- `email_verifications` - Email verification tokens (24-hour expiration)
- `password_resets` - Password reset tokens (1-hour expiration)
- `auth_logs` - Authentication event logging (7-day retention)

## Usage Examples

### Client-Side Authentication

```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

// Sign up with email
const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  name: 'John Doe',
});

// Sign in with email
const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  rememberMe: true, // Extends session to 30 days
});

// Sign in with Google
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',
});

// Sign out
await authClient.signOut();
```

### Server-Side API Routes

```typescript
import { withAuth } from '@/middleware/auth.middleware';
import { NextRequest } from 'next/server';

// Protected route - requires authentication
export const GET = withAuth(async (req: NextRequest, session) => {
  // Access user data from session
  const userId = session.user.id;
  const email = session.user.email;
  const tier = session.user.subscription_tier;

  return Response.json({
    user: session.user,
    data: 'protected data',
  });
});

// Protected route with tier requirement
export const POST = withAuth(
  async (req: NextRequest, session) => {
    // User has pro tier or higher
    return Response.json({ feature: 'pro feature' });
  },
  { requiredTier: 'pro' }
);

// Optional authentication - doesn't error if not logged in
import { withOptionalAuth } from '@/middleware/auth.middleware';

export const GET = withOptionalAuth(async (req: NextRequest, session) => {
  if (session) {
    return Response.json({ user: session.user });
  }
  return Response.json({ message: 'Not logged in' });
});
```

### Session Validation

```typescript
import { getAuthenticatedUser } from '@/middleware/auth.middleware';

export async function GET(req: NextRequest) {
  const { user, session, error } = await getAuthenticatedUser(req);

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({ user, session });
}
```

## Security Features

### Password Hashing

- Algorithm: bcrypt
- Cost factor: 12 (recommended balance of security and performance)
- Automatic salting included

### Password Complexity

Minimum requirements:
- 8+ characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one symbol

### Rate Limiting

- **Login**: 10 attempts per minute per IP address
- **Password Reset**: 3 attempts per hour per email
- **Account Lockout**: 5 failed attempts triggers 30-minute lock

### JWT Token Configuration

- **Default Expiration**: 3 days
- **Remember Me**: 30 days
- **Algorithm**: HS256
- **Secret**: Minimum 32 characters (from `BETTER_AUTH_SECRET`)

### Email Verification

- Required for email/password registration
- Pre-verified for OAuth users (Google, Microsoft)
- Token expiration: 24 hours
- Resend functionality available

### Account Lockout

- Triggered after 5 failed login attempts
- Lock duration: 30 minutes
- Security email sent to user
- Automatic unlock after lockout period

## OAuth Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Secret to environment variables

### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application in Azure Active Directory
3. Add redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/microsoft`
   - Production: `https://your-domain.com/api/auth/callback/microsoft`
4. Add API permissions: email, profile
5. Generate client secret
6. Copy Application ID and Client Secret to environment variables

## Email Service Setup

### Resend Configuration

1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Verify your domain (for production)
4. Update environment variables:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

### Email Templates

Email templates are defined in `src/services/email.service.ts`:

1. **Email Verification** - Welcome message with verification link
2. **Password Reset** - Reset link with 1-hour expiration notice
3. **Password Changed** - Confirmation notification
4. **Account Lockout** - Security alert with lockout details

## Troubleshooting

### Common Issues

**Issue**: "SUPABASE_DATABASE_URL not found"
- **Fix**: Ensure environment variable is set in `.env.local`

**Issue**: "BETTER_AUTH_SECRET must be at least 32 characters"
- **Fix**: Generate a secure secret: `openssl rand -base64 32`

**Issue**: OAuth callback not working
- **Fix**: Verify redirect URIs match exactly in OAuth provider console

**Issue**: Emails not sending
- **Fix**: Verify Resend API key and domain verification

**Issue**: Rate limiting too aggressive
- **Fix**: Adjust limits in `src/lib/auth.ts` rateLimit configuration

## Testing

### Test Email/Password Registration

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Test Protected Route

```bash
curl http://localhost:3000/api/protected \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Next Steps

After completing Better Auth setup:

1. **Task 003**: Implement core authentication API endpoints
2. **Task 004**: Add password management and account security
3. **Task 005**: Build session management and logout
4. **Task 006**: Create frontend authentication UI components

## Resources

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
