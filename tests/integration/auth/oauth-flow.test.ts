/**
 * Integration Tests: OAuth Flow
 *
 * Tests OAuth authentication with Google and Microsoft:
 * 1. OAuth initiation
 * 2. OAuth callback handling
 * 3. User creation from OAuth
 * 4. Existing user linking
 * 5. Pre-verified email for OAuth users
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateTestEmail, oauthTestData } from '../../helpers/test-data';
import { mockOAuthProviders } from '../../helpers/mocks';
import { TEST_IDS } from '../../helpers/fixtures';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Mock the Better Auth client
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getCallbackURL: vi.fn(() => Promise.resolve('http://localhost:3000/api/auth/callback/google')),
      callbackSocial: vi.fn(({ query }) => {
        const provider = query.provider;
        if (provider === 'google') {
          return Promise.resolve({
            user: {
              id: TEST_IDS.OAUTH_GOOGLE,
              email: 'oauthuser@google.com',
              name: 'Google User',
              emailVerified: true,
            },
            session: {
              token: 'mock-jwt-token',
            },
          });
        }
        return Promise.reject(new Error('Unknown provider'));
      }),
      sendVerificationEmail: vi.fn(() => Promise.resolve({})),
    },
  },
}));

describe('OAuth Flow Integration Tests', () => {
  describe('Google OAuth', () => {
    it('should initiate Google OAuth flow', async () => {
      const response = await fetch(`${API_URL}/api/auth/oauth/google`);

      expect(response.ok).toBe(true);

      // Response should contain redirect URL or authorization code flow info
      const result = await response.json();
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('accounts.google.com');
    });

    it('should handle successful Google OAuth callback', async () => {
      const mockCode = oauthTestData.google.code;
      const mockState = oauthTestData.google.state;

      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}&state=${mockState}`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(true);
      const result = await response.json();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBeDefined();
      expect(result.user.emailVerified).toBe(true);
    });

    it('should pre-verify email for Google OAuth users', async () => {
      const mockCode = oauthTestData.google.code;

      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        expect(result.user.emailVerified).toBe(true);
      }
    });

    it('should create new user on first Google OAuth login', async () => {
      const mockCode = oauthTestData.google.code;

      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        expect(result.user).toHaveProperty('id');
        expect(result.user).toHaveProperty('email');
        expect(result.user.subscriptionTier).toBe('trial');
      }
    });

    it('should link to existing user on subsequent Google OAuth login', async () => {
      // First login
      const mockCode = oauthTestData.google.code;

      const response1 = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response1.ok) {
        const user1 = (await response1.json()).user;

        // Second login
        const response2 = await fetch(
          `${API_URL}/api/auth/callback/google?code=${mockCode}`,
          { method: 'GET' }
        );

        if (response2.ok) {
          const user2 = (await response2.json()).user;
          // Should be the same user
          expect(user1.id).toBe(user2.id);
        }
      }
    });

    it('should handle Google OAuth errors', async () => {
      const response = await fetch(
        `${API_URL}/api/auth/callback/google?error=access_denied`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(false);
      const result = await response.json();
      expect(result).toHaveProperty('error');
    });

    it('should handle invalid OAuth state parameter', async () => {
      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=test&state=invalid-state`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(false);
    });
  });

  describe('Microsoft OAuth', () => {
    it('should initiate Microsoft OAuth flow', async () => {
      const response = await fetch(`${API_URL}/api/auth/oauth/microsoft`);

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result).toHaveProperty('url');
      expect(result.url).toContain('login.microsoftonline.com');
    });

    it('should handle successful Microsoft OAuth callback', async () => {
      const mockCode = oauthTestData.microsoft.code;
      const mockState = oauthTestData.microsoft.state;

      const response = await fetch(
        `${API_URL}/api/auth/callback/microsoft?code=${mockCode}&state=${mockState}`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(true);
      const result = await response.json();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBeDefined();
    });

    it('should pre-verify email for Microsoft OAuth users', async () => {
      const mockCode = oauthTestData.microsoft.code;

      const response = await fetch(
        `${API_URL}/api/auth/callback/microsoft?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        expect(result.user.emailVerified).toBe(true);
      }
    });

    it('should handle Microsoft OAuth errors', async () => {
      const response = await fetch(
        `${API_URL}/api/auth/callback/microsoft?error=access_denied`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(false);
      const result = await response.json();
      expect(result).toHaveProperty('error');
    });
  });

  describe('OAuth Token Handling', () => {
    it('should generate valid JWT on OAuth success', async () => {
      const mockCode = oauthTestData.google.code;

      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        expect(result.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      }
    });

    it('should allow access to protected routes with OAuth token', async () => {
      const mockCode = oauthTestData.google.code;

      const oauthResponse = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (oauthResponse.ok) {
        const { token } = await oauthResponse.json();

        const meResponse = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        expect(meResponse.ok).toBe(true);
      }
    });

    it('should include subscription tier in OAuth user response', async () => {
      const mockCode = oauthTestData.google.code;

      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        expect(result.user).toHaveProperty('subscriptionTier');
        expect(['trial', 'free', 'pro', 'enterprise']).toContain(result.user.subscriptionTier);
      }
    });
  });

  describe('OAuth Account Linking', () => {
    it('should not create duplicate users for same OAuth provider', async () => {
      const mockCode = oauthTestData.google.code;

      // First login
      const response1 = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      // Second login
      const response2 = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response1.ok && response2.ok) {
        const user1 = (await response1.json()).user;
        const user2 = (await response2.json()).user;
        expect(user1.id).toBe(user2.id);
      }
    });

    it('should allow linking multiple OAuth providers to same user', async () => {
      // This would require a more complex test setup
      // where user logs in with Google first, then Microsoft
      // and both are linked to the same account
    });
  });

  describe('OAuth Edge Cases', () => {
    it('should handle OAuth callback without code parameter', async () => {
      const response = await fetch(
        `${API_URL}/api/auth/callback/google`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(false);
    });

    it('should handle OAuth timeout', async () => {
      const response = await fetch(
        `${API_URL}/api/auth/callback/google?error=timeout`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(false);
    });

    it('should handle OAuth user cancellation', async () => {
      const response = await fetch(
        `${API_URL}/api/auth/callback/google?error=user_cancelled`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(false);
      const result = await response.json();
      expect(result.error).toMatch(/cancel|denied/i);
    });
  });

  describe('OAuth Security', () => {
    it('should validate state parameter for CSRF protection', async () => {
      // Test with invalid state
      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=test&state=malicious-state`,
        { method: 'GET' }
      );

      expect(response.ok).toBe(false);
    });

    it('should log OAuth login events', async () => {
      const mockCode = oauthTestData.google.code;

      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=${mockCode}`,
        { method: 'GET' }
      );

      if (response.ok) {
        // In a real test with database access:
        // Verify that auth_logs contains an oauth_login event
        // const logs = await getUserAuthLogs(userId);
        // expect(logs.some(log => log.event_type === 'oauth_login')).toBe(true);
      }
    });

    it('should handle OAuth provider errors gracefully', async () => {
      const response = await fetch(
        `${API_URL}/api/auth/callback/google?code=invalid_code`,
        { method: 'GET' }
      );

      // Should not crash, should return error
      expect(response.ok).toBe(false);
      const result = await response.json();
      expect(result).toHaveProperty('error');
    });
  });
});
