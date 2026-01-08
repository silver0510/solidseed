# Manual Testing Checklist

## Prerequisites

- [ ] Development server running: `npm run dev`
- [ ] .env.local configured with all credentials
- [ ] Integration test script passed: `./scripts/integration-test.sh`

## Database Testing

### Create Test User

```bash
# Using Supabase SQL Editor or via API
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

- [ ] User created successfully
- [ ] Email verification sent
- [ ] User appears in Supabase users table

### Read Operations

- [ ] Query users table
- [ ] Verify RLS policies work
- [ ] Check indexes are used

### Write Operations

- [ ] Insert test record
- [ ] Update test record
- [ ] Delete test record
- [ ] Verify soft delete works

## Storage Testing

### File Upload

```bash
# Create test file
echo "Test document content" > test-file.txt

# Upload via test endpoint
curl -X POST http://localhost:3000/api/test/storage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-file.txt"
```

- [ ] File uploaded successfully
- [ ] File path returned
- [ ] Public URL accessible
- [ ] Signed URL works

### File Download

- [ ] Public URL downloads file
- [ ] Signed URL downloads file
- [ ] Unauthorized access blocked

### File Deletion

```bash
curl -X DELETE http://localhost:3000/api/test/storage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filePath":"user-id/test-uploads/test-file.txt"}'
```

- [ ] File deleted successfully
- [ ] File no longer accessible
- [ ] Proper error for missing file

## Email Testing

### Verification Email

```bash
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "verification"
  }'
```

- [ ] Email sent successfully
- [ ] Email received in inbox
- [ ] Email formatted correctly
- [ ] Verification link works

### Password Reset Email

```bash
curl -X POST http://localhost:3000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "password-reset"
  }'
```

- [ ] Email sent successfully
- [ ] Email received in inbox
- [ ] Reset link formatted correctly

### Check Resend Dashboard

- [ ] Email appears in dashboard
- [ ] Delivery status is "delivered"
- [ ] No errors reported

## OAuth Testing

### Google OAuth Flow

1. Navigate to: `http://localhost:3000/auth/signin`
2. Click "Sign in with Google"
3. Complete Google OAuth consent
4. Redirected back to app

- [ ] OAuth consent screen appears
- [ ] User can authorize app
- [ ] Redirect back to app works
- [ ] User logged in successfully
- [ ] User data saved to database

### OAuth Error Handling

- [ ] Cancel OAuth → proper error message
- [ ] Invalid redirect URI → proper error
- [ ] Multiple sign-ins work

## Sentry Monitoring

### Test Error Capture

```bash
curl http://localhost:3000/api/test/sentry
```

- [ ] Error sent to Sentry
- [ ] Error appears in Sentry dashboard
- [ ] Stack trace captured
- [ ] Context information present

### Check Sentry Dashboard

- [ ] Project exists
- [ ] Errors are captured
- [ ] Environment set correctly (development)
- [ ] Source maps working (if configured)

## Health Check Endpoint

### Test Health Endpoint

```bash
curl http://localhost:3000/api/health | jq
```

- [ ] Returns 200 status code
- [ ] All services show "healthy"
- [ ] Latency reported for each service
- [ ] System information present

### Test Service Failures

- [ ] Stop database → health check shows unhealthy
- [ ] Invalid storage bucket → degraded status
- [ ] Restart services → back to healthy

## Environment Validation

### Test with Missing Variables

1. Rename .env.local temporarily
2. Start server
3. Should see validation errors

- [ ] Validation errors shown clearly
- [ ] Missing variables listed
- [ ] Server refuses to start

### Test with Invalid Variables

1. Set invalid value (e.g., malformed URL)
2. Start server
3. Should see validation errors

- [ ] Invalid format detected
- [ ] Clear error message
- [ ] Server refuses to start

## Vercel CLI Testing

### Test Vercel Dev

```bash
vercel dev
```

- [ ] Server starts on localhost:3000
- [ ] Environment variables loaded
- [ ] All features work same as `npm run dev`

### Test Vercel Preview

```bash
vercel
```

- [ ] Preview deployment created
- [ ] Unique URL provided
- [ ] Environment variables set
- [ ] All services work in preview

## Documentation Review

- [ ] README has complete setup instructions
- [ ] All environment variables documented in .env.example
- [ ] OAuth setup instructions clear
- [ ] Deployment instructions present
- [ ] Troubleshooting guide available

## Final Checks

- [ ] All integration tests pass
- [ ] No console errors in browser
- [ ] No errors in server logs
- [ ] All TypeScript types valid
- [ ] ESLint passes
- [ ] Build succeeds: `npm run build`

## Sign-Off

Date: \_\_\_\_\_\_\_\_\_\_

Tester: \_\_\_\_\_\_\_\_\_\_

Status: ✅ PASS / ❌ FAIL

Notes:

---
