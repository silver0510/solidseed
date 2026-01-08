import * as Sentry from '@sentry/nextjs';
import { validateEnvironment } from './lib/validate-env';

export async function register() {
  // Validate environment before initializing Sentry
  validateEnvironment();

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
