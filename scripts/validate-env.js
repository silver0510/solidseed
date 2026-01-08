#!/usr/bin/env node

/**
 * Environment variable validation script
 * Validates required environment variables for the application
 */

require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_DATABASE_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'BETTER_AUTH_SECRET',
];

const optionalVars = [
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
];

console.log('🔍 Validating environment variables...\n');

let hasErrors = false;
const missing = [];
const invalid = [];

// Check required variables
requiredVars.forEach((varName) => {
  const value = process.env[varName];

  if (!value) {
    missing.push(varName);
    hasErrors = true;
  } else {
    // Specific validation for certain vars
    if (varName.includes('URL') && varName !== 'SUPABASE_DATABASE_URL' && !value.startsWith('http')) {
      invalid.push(`${varName} must be a valid URL (got: ${value.substring(0, 20)}...)`);
      hasErrors = true;
    } else if (varName === 'SUPABASE_DATABASE_URL' && !value.startsWith('postgresql://')) {
      invalid.push(`${varName} must be a PostgreSQL connection string (got: ${value.substring(0, 20)}...)`);
      hasErrors = true;
    } else if (varName === 'RESEND_API_KEY' && !value.startsWith('re_')) {
      invalid.push(`${varName} must start with 're_' (got: ${value.substring(0, 10)}...)`);
      hasErrors = true;
    } else if (varName === 'BETTER_AUTH_SECRET' && value.length < 32) {
      invalid.push(`${varName} must be at least 32 characters long (got: ${value.length} characters)`);
      hasErrors = true;
    }
  }
});

// Report results
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:\n');
  missing.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('');
}

if (invalid.length > 0) {
  console.error('❌ Invalid environment variable values:\n');
  invalid.forEach((error) => {
    console.error(`   - ${error}`);
  });
  console.error('');
}

if (!hasErrors) {
  console.log('✅ All required environment variables are valid\n');

  // Show optional variables status
  const presentOptional = optionalVars.filter((v) => process.env[v]);
  if (presentOptional.length > 0) {
    console.log('📋 Optional variables configured:');
    presentOptional.forEach((v) => console.log(`   - ${v}`));
    console.log('');
  }

  const missingOptional = optionalVars.filter((v) => !process.env[v]);
  if (missingOptional.length > 0) {
    console.log('ℹ️  Optional variables not configured (this is OK):');
    missingOptional.forEach((v) => console.log(`   - ${v}`));
    console.log('');
  }

  process.exit(0);
} else {
  console.error('💡 Tip: Copy .env.example to .env.local and fill in your credentials\n');
  process.exit(1);
}
