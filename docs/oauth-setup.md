# OAuth Provider Setup Guide

This guide provides step-by-step instructions for setting up OAuth authentication with Google and Microsoft for the Korella CRM application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Google OAuth Setup](#google-oauth-setup)
- [Microsoft OAuth Setup](#microsoft-oauth-setup)
- [Environment Configuration](#environment-configuration)
- [Testing OAuth Flows](#testing-oauth-flows)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Prerequisites

Before setting up OAuth providers, ensure you have:

- [ ] A Google account with access to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] A Microsoft account with access to [Azure Portal](https://portal.azure.com/)
- [ ] Korella application running locally (`npm run dev`)
- [ ] SSL certificates for production domains (required for OAuth)

---

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click **New Project**
4. Enter project details:
   - **Project name**: `Korella CRM`
   - **Organization**: Select your organization (or leave as "No organization")
   - **Location**: Select appropriate folder or leave as default
5. Click **Create**
6. Wait for the project to be created and select it from the dropdown

<!-- Screenshot placeholder: GCP New Project dialog -->

### Step 2: Enable Required APIs

1. In the Google Cloud Console, navigate to **APIs & Services** > **Library**
2. Search for and enable the following APIs:
   - **Google+ API** (for basic profile information)
   - **Google People API** (for extended profile data)
3. Click on each API and press **Enable**

<!-- Screenshot placeholder: API Library with Google+ API -->

### Step 3: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (unless using Google Workspace)
3. Click **Create**
4. Fill in the OAuth consent screen details:

**App Information:**
| Field | Value |
|-------|-------|
| App name | `Korella CRM` |
| User support email | `support@korella.com` |
| App logo | Upload Korella logo (optional) |

**App Domain:**
| Field | Value |
|-------|-------|
| Application home page | `https://korella.com` |
| Application privacy policy link | `https://korella.com/privacy` |
| Application terms of service link | `https://korella.com/terms` |

**Developer Contact Information:**
| Field | Value |
|-------|-------|
| Email addresses | `dev@korella.com` |

5. Click **Save and Continue**

### Step 4: Configure Scopes

1. Click **Add or Remove Scopes**
2. Select the following scopes:
   - `../auth/userinfo.email` - See your primary Google Account email address
   - `../auth/userinfo.profile` - See your personal info
   - `openid` - Associate you with your personal info on Google
3. Click **Update**
4. Click **Save and Continue**

### Step 5: Add Test Users (Development Only)

1. Click **Add Users**
2. Enter email addresses of development team members
3. Click **Save and Continue**
4. Review the summary and click **Back to Dashboard**

> **Note**: While in "Testing" mode, only added test users can authenticate. For production, you'll need to submit for verification.

### Step 6: Create OAuth 2.0 Client ID

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure the client:

| Field | Value |
|-------|-------|
| Application type | `Web application` |
| Name | `Korella Web App` |

4. Add **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://staging.korella.com
   https://app.korella.com
   ```

5. Add **Authorized redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/google
   https://staging.korella.com/api/auth/callback/google
   https://app.korella.com/api/auth/callback/google
   ```

6. Click **Create**

<!-- Screenshot placeholder: OAuth Client ID creation form -->

### Step 7: Save Credentials

After creating the OAuth client, you'll see a dialog with:
- **Client ID**: Copy this value
- **Client Secret**: Copy this value

Store these securely in your environment variables:
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

> **Important**: Never commit these credentials to version control.

---

## Microsoft OAuth Setup

### Step 1: Register Application in Azure AD

1. Navigate to [Azure Portal](https://portal.azure.com/)
2. Search for **Azure Active Directory** or **Microsoft Entra ID**
3. Navigate to **App registrations** in the left sidebar
4. Click **New registration**
5. Configure the application:

| Field | Value |
|-------|-------|
| Name | `Korella CRM` |
| Supported account types | `Accounts in any organizational directory and personal Microsoft accounts` |
| Redirect URI (optional) | Leave blank for now |

6. Click **Register**

<!-- Screenshot placeholder: Azure App Registration form -->

### Step 2: Note Application (Client) ID

After registration, you'll be taken to the app overview page. Copy the following:
- **Application (client) ID**: This is your `MICROSOFT_CLIENT_ID`
- **Directory (tenant) ID**: Note this for reference (use `common` for multi-tenant)

### Step 3: Configure Redirect URIs

1. In your app registration, navigate to **Authentication** in the left sidebar
2. Click **Add a platform**
3. Select **Web**
4. Add the following redirect URIs:

**Development:**
```
http://localhost:3000/api/auth/callback/microsoft
```

**Staging:**
```
https://staging.korella.com/api/auth/callback/microsoft
```

**Production:**
```
https://app.korella.com/api/auth/callback/microsoft
```

5. Under **Implicit grant and hybrid flows**, ensure both options are **unchecked** (we use authorization code flow)
6. Click **Configure**

<!-- Screenshot placeholder: Azure Authentication configuration -->

### Step 4: Add API Permissions

1. Navigate to **API permissions** in the left sidebar
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add the following permissions:

| Permission | Description |
|------------|-------------|
| `email` | View users' email address |
| `openid` | Sign users in |
| `profile` | View users' basic profile |
| `User.Read` | Sign in and read user profile |

6. Click **Add permissions**
7. Click **Grant admin consent for [Your Organization]** (if you have admin rights)

<!-- Screenshot placeholder: API Permissions configuration -->

### Step 5: Generate Client Secret

1. Navigate to **Certificates & secrets** in the left sidebar
2. Click **New client secret**
3. Configure the secret:

| Field | Value |
|-------|-------|
| Description | `Korella Web App Secret` |
| Expires | `24 months` (recommended) or custom |

4. Click **Add**
5. **Immediately copy the secret value** - it will only be shown once!

Store this securely in your environment variables:
```bash
MICROSOFT_CLIENT_SECRET=your-client-secret-value
```

> **Warning**: The secret value is only displayed once. If you lose it, you'll need to create a new one.

<!-- Screenshot placeholder: Client Secret creation -->

### Step 6: Verify Configuration

Your Microsoft OAuth setup should now include:
- Application (client) ID
- Client secret
- Redirect URIs for all environments
- API permissions (email, openid, profile, User.Read)

---

## Environment Configuration

### Required Environment Variables

Add the following to your `.env.local` file:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-application-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Application URL (for redirect URIs)
BETTER_AUTH_URL=http://localhost:3000
```

### Environment-Specific Configuration

| Environment | BETTER_AUTH_URL |
|-------------|-----------------|
| Development | `http://localhost:3000` |
| Staging | `https://staging.korella.com` |
| Production | `https://app.korella.com` |

### Vercel Environment Variables

When deploying to Vercel, add these environment variables in the Vercel dashboard:

1. Go to your project in [Vercel Dashboard](https://vercel.com/)
2. Navigate to **Settings** > **Environment Variables**
3. Add each OAuth variable for the appropriate environment (Production, Preview, Development)

---

## Testing OAuth Flows

### Manual Testing - Google OAuth

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Google OAuth endpoint:
   ```
   http://localhost:3000/api/auth/signin/google
   ```

3. Expected flow:
   - Redirect to Google consent screen
   - Log in with a test Google account
   - Authorize the application
   - Redirect back to the application
   - User session created

4. Verify in the database:
   - Check `users` table for new user record
   - Check `oauth_providers` table for Google provider mapping

### Manual Testing - Microsoft OAuth

1. Navigate to the Microsoft OAuth endpoint:
   ```
   http://localhost:3000/api/auth/signin/microsoft
   ```

2. Expected flow:
   - Redirect to Microsoft login
   - Log in with a Microsoft account
   - Authorize the application
   - Redirect back to the application
   - User session created

3. Verify in the database:
   - Check `users` table for new user record
   - Check `oauth_providers` table for Microsoft provider mapping

### Common Test Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| New user signs in with Google | User created, OAuth provider linked |
| Existing user signs in with Google | User authenticated, no duplicate created |
| New user signs in with Microsoft | User created, OAuth provider linked |
| User with same email via different provider | Account linking prompt or error |
| Cancelled OAuth flow | Redirect to login with error message |

---

## Troubleshooting

### Google OAuth Issues

#### "Error 400: redirect_uri_mismatch"
- Verify the redirect URI in Google Console exactly matches your application
- Check for trailing slashes or protocol mismatches (http vs https)
- Ensure you're using the correct environment URL

#### "Access blocked: This app's request is invalid"
- OAuth consent screen may not be properly configured
- App may still be in "Testing" mode without verified test users

#### "This app isn't verified"
- Normal during development with external user type
- Click "Advanced" > "Go to Korella CRM (unsafe)" to continue testing
- Submit for verification before production launch

### Microsoft OAuth Issues

#### "AADSTS50011: The reply URL specified in the request does not match"
- Verify redirect URI in Azure Portal exactly matches your application
- Check for trailing slashes or case sensitivity issues

#### "AADSTS700016: Application with identifier was not found"
- Client ID may be incorrect
- Application may not be registered in the correct directory

#### "AADSTS7000215: Invalid client secret provided"
- Client secret may have expired
- Ensure you're using the secret value, not the secret ID
- Generate a new client secret if needed

### General Issues

#### OAuth callback returns 404
- Verify the callback route exists in your application
- Check that Better Auth is properly configured
- Ensure the API route is correctly implemented

#### Session not persisting after OAuth
- Check browser cookie settings
- Verify BETTER_AUTH_SECRET is set
- Check for CORS or same-site cookie issues

---

## Security Best Practices

### Credential Management

1. **Never commit secrets to version control**
   - Use `.env.local` for local development
   - Use environment variables in CI/CD
   - Add `.env*` to `.gitignore`

2. **Use different OAuth apps per environment**
   - Separate apps for development, staging, and production
   - Limits blast radius if credentials are compromised

3. **Rotate secrets regularly**
   - Google: Re-generate client secret every 6-12 months
   - Microsoft: Set appropriate expiration, rotate before expiry

### Application Security

1. **Verify state parameter**
   - Better Auth handles this automatically
   - Prevents CSRF attacks

2. **Use HTTPS in production**
   - Required for OAuth redirect URIs
   - Prevents token interception

3. **Validate redirect URIs**
   - Only allow explicitly configured URIs
   - Prevents open redirect vulnerabilities

### Monitoring

1. **Monitor OAuth usage**
   - Track sign-in attempts in `auth_logs` table
   - Set up alerts for unusual patterns

2. **Review OAuth app permissions regularly**
   - Google Cloud Console > APIs & Services > Credentials
   - Azure Portal > App registrations > API permissions

---

## Quick Reference

### Redirect URI Format

| Provider | Format |
|----------|--------|
| Google | `{APP_URL}/api/auth/callback/google` |
| Microsoft | `{APP_URL}/api/auth/callback/microsoft` |

### Required Scopes

| Provider | Scopes |
|----------|--------|
| Google | `email`, `profile`, `openid` |
| Microsoft | `email`, `profile`, `openid`, `User.Read` |

### Environment Variables Summary

```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Microsoft OAuth
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxx

# Application
BETTER_AUTH_URL=https://app.korella.com
```

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Korella CRM PRD - User Authentication](../.claude/prds/user-authentication.md)
