import type { NextConfig } from 'next';
import withPWA from 'next-pwa';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  // Disable trailing slash to fix Better Auth 404 issues
  trailingSlash: false,
};

// next-pwa 5.x injects a webpack function even when `disable: true`, which
// breaks Turbopack's module resolution in dev. Skip the wrapper entirely in dev.
const configWithPWA =
  process.env.NODE_ENV === 'development'
    ? nextConfig
    : withPWA({
        dest: 'public',
        register: true,
        skipWaiting: true,
      })(nextConfig);

export default withSentryConfig(configWithPWA, {
  org: 'pacificwide',
  project: 'solidseed',

  silent: !process.env.CI,
  widenClientFileUpload: true,

  webpack: {
    // Sentry's config wrapper injects experimental.clientTraceMetadata which
    // triggers a Turbopack bug in Next.js 16.1.x ("Next.js package not found" panic).
    // Disable in dev; instrumentation still works via the runtime SDK.
    // Source map upload runs at production build time.
    disableSentryConfig: process.env.NODE_ENV === 'development',

    automaticVercelMonitors: true,

    treeshake: {
      removeDebugLogging: true,
    },
  },
});
