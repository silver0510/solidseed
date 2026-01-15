# Supabase Setup Guide

Complete guide for setting up Supabase for the Korella CRM project, covering both development and production environments.

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
   - Name: `korella-crm-dev` (or `korella-crm-prod` for production)
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

### 1. Create Storage Bucket

1. **Navigate to Storage**
   - Supabase Dashboard → Storage
   - Click "New bucket"

2. **Configure Bucket Settings**
   - Name: `client-documents`
   - Public bucket: **OFF** (unchecked)
   - File size limit: `10485760` (10MB in bytes)
   - Allowed MIME types:
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     image/jpeg
     image/png
     ```

3. **Click "Create bucket"**

### 2. Configure Storage RLS Policies

1. **Navigate to Storage Policies**
   - Storage → Policies
   - Select `client-documents` bucket

2. **Add Storage Policies**

Open SQL Editor (Database → SQL Editor) and run:

```sql
-- Policy: Users can upload documents for their clients
CREATE POLICY "Users can upload documents for their clients"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = (storage.foldername(name))[1]::uuid
    AND clients.assigned_to = auth.uid()
    AND clients.is_deleted = FALSE
  )
);

-- Policy: Users can read documents for their clients
CREATE POLICY "Users can read documents for their clients"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = (storage.foldername(name))[1]::uuid
    AND clients.assigned_to = auth.uid()
    AND clients.is_deleted = FALSE
  )
);

-- Policy: Users can delete documents for their clients
CREATE POLICY "Users can delete documents for their clients"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-documents' AND
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = (storage.foldername(name))[1]::uuid
    AND clients.assigned_to = auth.uid()
  )
);
```

**Note**: The folder name is cast to UUID (`::uuid`) to match the `clients.id` column type.

### 3. Verify Storage Policies

```sql
-- Check storage policies
SELECT * FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';
```

Expected output: 3 policies for `client-documents` bucket.

## Authentication Configuration

### 1. Configure Auth Settings

Supabase Dashboard → Authentication → Settings:

**General Settings:**

- Site URL: `http://localhost:3000` (dev) or `https://korella.app` (prod)
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
APP_URL=https://korella.app
NODE_ENV=production
```

## Production Setup

### 1. Create Production Project

Follow same steps as development, but:

- Project name: `korella-crm-prod`
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

**Error: "new row violates row-level security policy"**

- Verify RLS policies are created correctly
- Check `auth.uid()` comparison uses UUID (no text cast needed)
- Test with authenticated user session

**Files not uploading**

- Check bucket exists and is private
- Verify MIME types are allowed
- Check file size is under 10MB
- Test storage policies with SQL:
  ```sql
  -- Test if user can access client
  SELECT * FROM clients
  WHERE assigned_to = 'your-user-id'
  AND is_deleted = FALSE;
  ```

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
