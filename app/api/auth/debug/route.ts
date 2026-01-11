/**
 * Debug endpoint to inspect Better Auth configuration
 */

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasHandler: typeof auth.handler === 'function',
    authKeys: Object.keys(auth),
    apiKeys: Object.keys(auth.api || {}),
    optionsKeys: Object.keys(auth.options || {}),
    socialProviders: (auth.options as any)?.socialProviders,
  });
}
