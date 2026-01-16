import { env } from './env';

/**
 * Validates environment variables on application startup
 * Call this in instrumentation.ts or root layout
 */
export function validateEnvironment(): void {
  console.log('🔍 Validating environment variables...');

  try {
    // Access env to trigger validation
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_DATABASE_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'RESEND_API_KEY',
      'BETTER_AUTH_SECRET',
    ];

    requiredVars.forEach((varName) => {
      if (!env[varName as keyof typeof env]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
    });

    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw error;
  }
}
