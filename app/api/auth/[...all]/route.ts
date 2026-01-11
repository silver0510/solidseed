/**
 * Better Auth Catch-All Route Handler
 *
 * This route handles all Better Auth endpoints including:
 * - OAuth flows (sign-in/social, callback/google, etc.)
 * - Session management
 * - All other Better Auth operations
 */

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
