/**
 * Test Data Helpers
 *
 * Provides reusable test data and generators for integration tests
 */

export const testUser = {
  fullName: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!',
  weakPassword: 'weak',
};

export const generateTestEmail = () => {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
};

export const generateTestUser = () => {
  return {
    fullName: `Test User ${Date.now()}`,
    email: generateTestEmail(),
    password: 'TestPassword123!',
  };
};

export const oauthProviders = ['google', 'microsoft'] as const;
export type OAuthProvider = (typeof oauthProviders)[number];

export const subscriptionTiers = ['trial', 'free', 'pro', 'enterprise'] as const;
export type SubscriptionTier = (typeof subscriptionTiers)[number];

export const accountStatuses = ['pending', 'active', 'deactivated'] as const;
export type AccountStatus = (typeof accountStatuses)[number];

/**
 * Wait for a specified amount of time (useful for testing expirations)
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract token from email (would require email interception in real scenario)
 */
export const extractTokenFromEmail = (emailContent: string): string => {
  // This is a placeholder - in real scenario would parse email content
  // and extract the verification/reset token
  const match = emailContent.match(/token=([a-zA-Z0-9-]+)/);
  return match ? match[1] : '';
};

/**
 * Create a test user with verification
 */
export const createVerifiedUser = async (apiUrl: string) => {
  const userData = generateTestUser();

  // Register
  await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  // In real scenario, would extract token from email and verify
  // For now, return user data for manual verification in tests

  return {
    ...userData,
    // Add any additional fields returned by registration
  };
};

/**
 * Login and return token
 */
export const login = async (
  apiUrl: string,
  email: string,
  password: string,
  rememberMe = false
) => {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      rememberMe,
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Make authenticated request
 */
export const authenticatedFetch = async (
  apiUrl: string,
  token: string,
  endpoint: string,
  options?: RequestInit
) => {
  return fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};
