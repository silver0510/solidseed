import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

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

export default configWithPWA;
