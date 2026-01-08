# Troubleshooting Guide

## Environment Issues

### "Invalid environment variables"

**Cause**: Missing or malformed environment variables

**Solution**:

1. Compare `.env.local` with `.env.example`
2. Ensure all required variables are set
3. Check for typos in variable names
4. Verify values are in correct format (URLs, API keys)

```bash
# Validate environment
npm run validate-env
```

### "Module not found: lib/env"

**Cause**: Environment validation module missing

**Solution**:

```bash
# Ensure file exists
ls lib/env.ts

# Rebuild if needed
npm run build
```

## Database Issues

### "Database connection failed"

**Cause**: Invalid connection string or network issue

**Solution**:

1. Verify `SUPABASE_DATABASE_URL` is correct
2. Check database is running (Supabase dashboard)
3. Test connection:

```bash
psql "$SUPABASE_DATABASE_URL" -c "SELECT 1"
```

### "RLS policy violation"

**Cause**: Row-level security preventing access

**Solution**:

1. Check RLS policies in Supabase dashboard
2. Ensure user is authenticated
3. Verify policy logic allows operation

### "Table does not exist"

**Cause**: Migrations not applied

**Solution**:

```bash
# Apply migrations
supabase db push

# Or reset database
supabase db reset
```

## Storage Issues

### "Bucket not found"

**Cause**: Storage bucket not created

**Solution**:

1. Go to Supabase dashboard → Storage
2. Create bucket: "client-documents"
3. Configure RLS policies
4. Make bucket private (not public)

### "Upload failed"

**Cause**: File size limit or RLS policy

**Solution**:

1. Check file size (default 50MB limit)
2. Verify RLS policies allow upload
3. Ensure user is authenticated

## Email Issues

### "Invalid API key"

**Cause**: Wrong or missing Resend API key

**Solution**:

1. Verify `RESEND_API_KEY` starts with `re_`
2. Generate new key in Resend dashboard
3. Update `.env.local`

### "Email not received"

**Cause**: Various delivery issues

**Solution**:

1. Check spam folder
2. Verify email address is valid
3. Check Resend dashboard for delivery status
4. In development, use `onboarding@resend.dev` as from address

## OAuth Issues

### "redirect_uri_mismatch"

**Cause**: Redirect URI not matching exactly

**Solution**:

1. Verify redirect URI in Google Console
2. Format: `http://localhost:3000/api/auth/callback/google`
3. No trailing slash
4. Protocol must match (http vs https)

### "This app isn't verified"

**Cause**: OAuth consent screen not verified (normal for development)

**Solution**:

1. Add test users in Google Console
2. Or click "Advanced" → "Go to app (unsafe)" in consent screen
3. For production, submit app for verification

## Sentry Issues

### "Sentry not capturing errors"

**Cause**: DSN not configured or Sentry disabled

**Solution**:

1. Verify `SENTRY_DSN` is set
2. Check `enabled` flag in sentry config
3. Restart development server
4. Test with:

```bash
curl http://localhost:3000/api/test/sentry
```

## Build Issues

### "Build failed on Vercel"

**Cause**: Various build-time errors

**Solution**:

1. Run build locally: `npm run build`
2. Check Node.js version matches Vercel
3. Verify all dependencies in package.json
4. Review build logs for specific error

### "Type errors during build"

**Cause**: TypeScript type mismatches

**Solution**:

```bash
# Check types locally
npm run type-check

# Fix errors shown
```

## Performance Issues

### "Slow database queries"

**Cause**: Missing indexes or inefficient queries

**Solution**:

1. Add indexes for frequently queried columns
2. Use `EXPLAIN ANALYZE` in Supabase SQL editor
3. Optimize query patterns

### "High memory usage"

**Cause**: Memory leaks or large data processing

**Solution**:

1. Check health endpoint for memory stats
2. Monitor with Sentry performance tracking
3. Optimize data fetching (pagination, limits)

## Getting Help

If you can't resolve an issue:

1. **Check health endpoint**:

   ```bash
   curl http://localhost:3000/api/health | jq
   ```

2. **Review logs**:

   - Server logs in terminal
   - Browser console
   - Sentry dashboard
   - Vercel dashboard (production)

3. **Search documentation**:

   - [Supabase docs](https://supabase.com/docs)
   - [Next.js docs](https://nextjs.org/docs)
   - [Better Auth docs](https://better-auth.com/docs)

4. **Contact support**:
   - Supabase: support@supabase.io
   - Vercel: vercel.com/support
   - Sentry: sentry.io/support
