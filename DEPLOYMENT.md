# Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All tests passing: `npm run test`
- [ ] Type check passing: `npm run type-check`
- [ ] Linting passing: `npm run lint`
- [ ] Build successful: `npm run build`
- [ ] No console errors/warnings

### Environment Setup
- [ ] Production environment variables configured in Vercel
- [ ] Supabase production project created
- [ ] Production database URL set
- [ ] OAuth credentials updated for production domain
- [ ] Resend domain verified
- [ ] Sentry production project configured

### Database
- [ ] All migrations applied to production
- [ ] Database backup created
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Connection pooling configured

### Third-Party Services
- [ ] Google OAuth redirect URIs include production domain
- [ ] Resend domain verified and active
- [ ] Sentry DSN configured for production
- [ ] Supabase Storage buckets created
- [ ] API rate limits configured

### DNS & Domain
- [ ] Domain purchased (korella.app)
- [ ] Domain added to Vercel
- [ ] DNS records configured
- [ ] SSL certificate verified
- [ ] Redirects configured (www → apex)

## Deployment

### Deploy to Preview First
```bash
# Deploy to preview
vercel

# Test preview deployment thoroughly
# Visit preview URL and test all features
```

### Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use GitHub integration:
# Merge to main branch → automatic deployment
```

## Post-Deployment

### Verification

- [ ] Site loads: https://korella.app
- [ ] Authentication works (email/password)
- [ ] OAuth works (Google)
- [ ] Database reads/writes working
- [ ] File uploads working
- [ ] Email sending working
- [ ] Error tracking in Sentry

### Monitoring

- [ ] Sentry receiving errors
- [ ] Analytics configured (if any)
- [ ] Performance monitoring enabled
- [ ] Logs accessible in Vercel dashboard

### Security

- [ ] HTTPS working correctly
- [ ] Security headers present (check vercel.json)
- [ ] API routes protected
- [ ] RLS policies active
- [ ] Rate limiting working

## Rollback Plan

If deployment fails:

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <previous-deployment-url>
```

## Support Contacts

- Vercel Support: vercel.com/support
- Supabase Support: supabase.com/support
- Sentry Support: sentry.io/support
