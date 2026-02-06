import { z } from 'zod';

// Define schema for all environment variables
const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),

  // Supabase (Next.js public variables)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_DATABASE_URL: z.string().min(1),

  // Google OAuth
  // @see docs/oauth-setup.md for setup instructions
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // Resend Email
  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),

  // Authentication
  BETTER_AUTH_SECRET: z.string().min(32),

  // Vercel (optional, set automatically in production)
  VERCEL_URL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  VERCEL_OIDC_TOKEN: z.string().optional(),
});

// Infer TypeScript type from schema
export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

// Export validated environment variables
export const env = validateEnv();

// Helper to check if running in production
export const isProduction = env.NODE_ENV === 'production';

// Helper to check if running in development
export const isDevelopment = env.NODE_ENV === 'development';

// Helper to check if running in test
export const isTest = env.NODE_ENV === 'test';

// Helper to get app URL
export const getAppUrl = (): string => {
  if (env.VERCEL_URL && env.VERCEL_ENV === 'preview') {
    return `https://${env.VERCEL_URL}`;
  }
  return env.BETTER_AUTH_URL;
};
