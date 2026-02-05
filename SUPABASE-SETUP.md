# Supabase Setup Guide

Complete guide for setting up Supabase for the SolidSeed CRM project, covering both development and production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Project Setup](#initial-project-setup)
- [Database Configuration](#database-configuration)
- [Storage Configuration](#storage-configuration)
- [Authentication Configuration](#authentication-configuration)
- [Environment Variables](#environment-variables)
- [Production Setup](#production-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Supabase account ([supabase.com/dashboard](https://supabase.com/dashboard))
- Supabase CLI installed: `npm install -g supabase`
- PostgreSQL knowledge (basic)

## Initial Project Setup

### 1. Create Supabase Project

1. **Log in to Supabase Dashboard**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"

2. **Configure Project**
   - Organization: Select or create organization
   - Name: `solidseed-crm-dev` (or `solidseed-crm-prod` for production)
   - Database Password: Generate strong password (save securely!)
   - Region: Choose closest to your users (e.g., `East US (North Virginia)` for US East Coast)
   - Pricing Plan: Free (development) or Pro (production)

3. **Wait for Provisioning**
   - Takes 2-3 minutes
   - Note the project URL and keys when ready

### 2. Get Project Credentials

From Supabase Dashboard → Settings → API:

```bash
# Project URL
SUPABASE_URL=https://your-project-id.supabase.co

# Anonymous Key (public, safe for client-side)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (secret, server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

From Supabase Dashboard → Settings → Database:

```bash
# Connection string (use "Transaction" pooling mode)
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres
```

### 3. Initialize Local Supabase

```bash
# Initialize Supabase in project (if not already done)
supabase init

# Link to remote project
supabase link --project-ref your-project-id

# Pull remote schema (optional, to sync with existing setup)
supabase db pull
```

## Database Configuration

### 1. Run Migrations

Apply all database migrations to your Supabase project:

```bash
# Push all migrations to remote database
supabase db push

# Verify migrations applied successfully
supabase db remote list
```

### 2. Verify Tables Created

In Supabase Dashboard → Table Editor, verify these tables exist:

**Authentication Tables:**

- `users`
- `oauth_providers`
- `password_resets`
- `email_verifications`
- `auth_logs`
- `verification`
- `sessions`

**Client Hub Tables:**

- `clients`
- `client_tags`
- `client_documents`
- `client_notes`
- `client_tasks`

### 3. Enable Row Level Security (RLS)

RLS policies are automatically created by migrations, but verify they're enabled:

1. Go to Supabase Dashboard → Authentication → Policies
2. Verify each table has RLS enabled
3. Check that policies exist for each table

## Storage Configuration

### 1. Create Storage Buckets

The project uses three storage buckets for different purposes:

#### Bucket 1: `avatar` (User Profile Pictures)

1. **Navigate to Storage**
   - Supabase Dashboard → Storage
   - Click "New bucket"

2. **Configure Bucket Settings**
   - Name: `avatar`
   - Public bucket: **ON** (checked - avatars are publicly accessible)
   - File size limit: `5242880` (5MB in bytes)
   - Allowed MIME types:
     ```
     image/jpeg
     image/png
     image/webp
     ```

3. **Click "Create bucket"**

#### Bucket 2: `client-documents` (Client Hub Documents)

1. **Create New Bucket**
   - Name: `client-documents`
   - Public bucket: **OFF** (unchecked - private documents)
   - File size limit: `10485760` (10MB in bytes)
   - Allowed MIME types:
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     image/jpeg
     image/png
     ```

2. **Click "Create bucket"**

#### Bucket 3: `deal-documents` (Deal Management Documents)

1. **Create New Bucket**
   - Name: `deal-documents`
   - Public bucket: **OFF** (unchecked - private documents)
   - File size limit: `26214400` (25MB in bytes)
   - Allowed MIME types:
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     application/vnd.ms-excel
     application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
     image/jpeg
     image/png
     ```

2. **Click "Create bucket"**

### 2. Configure Storage RLS Policies

**IMPORTANT**: Since this project uses **Better Auth** instead of Supabase Auth, the standard `auth.uid()` RLS policies **will not work**. Better Auth does not populate Supabase's auth context.

#### For Development/Testing

**Option 1: No RLS Policies (Recommended for Better Auth)**

Since authorization is handled in the application code (API routes check user sessions and ownership), you can run the storage buckets without RLS policies:

1. Go to Storage → Select each bucket (`client-documents`, `deal-documents`)
2. Navigate to Policies tab
3. Ensure no policies exist (delete any auto-created policies)

The application uses:
- **Service Role Key** for storage operations (bypasses RLS)
- **Session validation** in API routes (checks user authentication)
- **Ownership checks** in service layer (verifies user owns the resource)

#### For Production (Optional: Service Role Policies)

If you want to add an extra layer of security, you can create policies that check against your `users` table, but these require custom auth context setup with Better Auth, which is beyond the basic configuration.

#### Avatar Bucket (Public)

The `avatar` bucket is public, so no RLS policies are needed:

1. Users can upload their own avatars (validated in API)
2. Anyone can view avatars (public URLs)
3. Only the owner can update/delete (validated in API)

### 3. Verify Storage Setup

Check that all buckets are created correctly:

1. **Navigate to Storage**
   - Supabase Dashboard → Storage
   - Verify all three buckets exist:
     - ✅ `avatar` (public)
     - ✅ `client-documents` (private)
     - ✅ `deal-documents` (private)

2. **Test Upload (Optional)**
   - Use the application to upload a document
   - Verify it appears in the correct bucket
   - Check that download URLs work

3. **Verify No Conflicting Policies**
   ```sql
   -- Check if any RLS policies exist on storage.objects
   SELECT * FROM pg_policies
   WHERE schemaname = 'storage'
   AND tablename = 'objects';
   ```

   Expected output: Empty (no policies for Better Auth setup)

## Authentication Configuration

### 1. Configure Auth Settings

Supabase Dashboard → Authentication → Settings:

**General Settings:**

- Site URL: `http://localhost:3000` (dev) or `https://solidseed.app` (prod)
- Additional Redirect URLs:
  ```
  http://localhost:3000/api/auth/callback
  http://localhost:3001/api/auth/callback
  ```

**Email Auth:**

- Enable Email Signup: **OFF** (we handle this with Better Auth)
- Confirm Email: **OFF** (handled by Better Auth)

**Security:**

- JWT Expiry: `3600` (1 hour)
- Refresh Token Expiry: `2592000` (30 days)

### 2. Disable Supabase Auth (Using Better Auth Instead)

We use Better Auth for authentication, not Supabase's built-in auth:

1. **Disable Supabase Auth Providers**
   - Authentication → Providers
   - Keep all providers disabled
   - We handle OAuth through Better Auth

2. **Important Notes**
   - Our `users` table is separate from Supabase's `auth.users`
   - We use Supabase only for database and storage
   - Better Auth handles all authentication logic
   - `auth.uid()` in RLS policies refers to Supabase's auth context (for future compatibility)

## Environment Variables

### Development (.env.local)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-id.supabase.co:5432/postgres

# Better Auth (not Supabase Auth)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-secret
JWT_SECRET=your-random-32-character-string

# Application
APP_URL=http://localhost:3000
NODE_ENV=development

# Email Service
RESEND_API_KEY=re_your_api_key

# Monitoring (optional)
SENTRY_DSN=https://key@org.ingest.sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://key@org.ingest.sentry.io/project-id
```

### Production

Same variables as development, but with production values:

```bash
SUPABASE_URL=https://your-prod-project-id.supabase.co
APP_URL=https://solidseed.app
NODE_ENV=production
```

## Production Setup

### 1. Create Production Project

Follow same steps as development, but:

- Project name: `solidseed-crm-prod`
- Choose Pro plan for better performance
- Enable Point-in-Time Recovery (PITR)
- Configure daily backups

### 2. Migration Strategy

```bash
# Connect to production project
supabase link --project-ref your-prod-project-id

# Push migrations to production
supabase db push

# Verify migrations
supabase db remote list
```

### 3. Production Checklist

- [ ] Database migrations applied
- [ ] Storage bucket created with correct settings
- [ ] Storage RLS policies configured
- [ ] All environment variables set in Vercel
- [ ] Database backups enabled
- [ ] Point-in-Time Recovery enabled (Pro plan)
- [ ] Connection pooling configured (use Transaction mode)
- [ ] Database password stored securely
- [ ] SSL enabled for database connections
- [ ] Monitor database usage in Supabase Dashboard

### 4. Security Hardening

1. **Database Access**
   - Use connection pooling (Transaction mode)
   - Restrict database access by IP (if possible)
   - Rotate database password quarterly

2. **API Keys**
   - Never commit API keys to Git
   - Use Vercel environment variables
   - Rotate service role key quarterly

3. **RLS Policies**
   - Regularly audit RLS policies
   - Test policies with different user roles
   - Monitor for unauthorized access attempts

## Troubleshooting

### Migration Errors

**Error: "relation already exists"**

```bash
# Reset remote database (WARNING: deletes all data)
supabase db reset --linked

# Or manually drop tables and rerun
```

**Error: "permission denied"**

- Check database user has correct permissions
- Verify connection string is correct
- Try using service role key

### Storage Issues

**Error: "Bucket not found"**

- Verify bucket exists in Supabase Dashboard → Storage
- Check bucket name matches exactly (case-sensitive):
  - `avatar`, `client-documents`, `deal-documents`
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly in `.env.local`

**Error: "new row violates row-level security policy"**

- This error occurs if RLS policies exist on storage buckets
- For Better Auth setup, **delete all storage RLS policies**
- Go to Storage → Select bucket → Policies → Delete all policies
- Application handles authorization in API routes

**Files not uploading**

- Check bucket exists with correct name
- Verify MIME type is allowed (see bucket configuration above)
- Check file size limits:
  - `avatar`: 5MB max
  - `client-documents`: 10MB max
  - `deal-documents`: 25MB max
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not `SUPABASE_ANON_KEY`)
- Check browser console and server logs for specific error messages

**Files upload but can't download**

- Verify signed URL generation is working
- Check file path format: `deals/{dealId}/documents/{fileId}_{filename}`
- Ensure service role key has read permissions
- Check that download URL hasn't expired (1 hour default)

### Connection Issues

**Error: "connection refused"**

- Verify `SUPABASE_DATABASE_URL` is correct
- Check database is not paused (free plan auto-pauses)
- Try connection pooling URL instead of direct connection

**Error: "too many connections"**

- Use connection pooling (Transaction mode)
- Reduce max connections in application
- Upgrade to Pro plan for more connections

### RLS Policy Issues

**Auth context not working**

- Remember: We use Better Auth, not Supabase Auth
- `auth.uid()` returns Supabase's auth user UUID
- Policies compare directly with UUID columns (no casting needed)
- User IDs are now UUID type (migrated from VARCHAR/CUID)

### Performance Issues

**Slow queries**

- Check indexes are created (auto-created by migrations)
- Use `EXPLAIN ANALYZE` to debug queries
- Enable pg_stat_statements in dashboard

**Storage slow**

- Enable CDN in Storage settings
- Use signed URLs with longer expiry
- Consider upgrading to Pro plan

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Better Auth Documentation](https://better-auth.com)

## Support

For Supabase-specific issues:

- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
- Supabase Support: support@supabase.io

For project-specific issues:

- Create issue in project repository
- Check TROUBLESHOOTING.md
