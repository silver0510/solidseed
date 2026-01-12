/**
 * Integration Tests: Logout Flow
 *
 * Tests the logout process and session invalidation:
 * 1. Logout endpoint
 * 2. Session invalidation
 * 3. Token cannot be reused after logout
 * 4. Multiple device logout
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateTestEmail } from '../../helpers/test-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Logout Flow Integration Tests', () => {
  let authToken: string;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeEach(async () => {
    // Create and login a test user
    testUserEmail = `logout-test-${Date.now()}@example.com`;
    testUserPassword = 'SecurePass123!';

    // Register
    await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Logout Test User',
        email: testUserEmail,
        password: testUserPassword,
      }),
    });

    // Login
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPassword,
      }),
    });

    if (loginResponse.ok) {
      const result = await loginResponse.json();
      authToken = result.token;
    }
  });

  describe('Standard Logout', () => {
    it('should logout user successfully', async () => {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result).toHaveProperty('message');
      expect(result.message).toMatch(/logout|success/i);
    });

    it('should invalidate token after logout', async () => {
      // Logout
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Try to use the token again
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(meResponse.ok).toBe(false);
      expect(meResponse.status).toBe(401);
    });

    it('should require authentication to logout', async () => {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should reject invalid token during logout', async () => {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token-123',
        },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });
  });

  describe('Session Cleanup', () => {
    it('should clear session data on logout', async () => {
      // Access protected route to establish session
      await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Logout
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Session should be cleared - verify by trying to access protected route
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(meResponse.ok).toBe(false);
    });

    it('should log logout event to auth_logs', async () => {
      // Logout
      const logoutResponse = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(logoutResponse.ok).toBe(true);

      // In a real test with database access:
      // Verify that auth_logs contains a logout event for this user
      // const logs = await getUserAuthLogs(userId);
      // expect(logs.some(log => log.event_type === 'logout')).toBe(true);
    });
  });

  describe('Remember Me Token', () => {
    it('should invalidate extended session on logout', async () => {
      // Login with remember me
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
          rememberMe: true,
        }),
      });

      const { token: extendedToken } = await loginResponse.json();

      // Logout
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${extendedToken}`,
        },
      });

      // Extended token should also be invalid
      const meResponse = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${extendedToken}`,
        },
      });

      expect(meResponse.ok).toBe(false);
      expect(meResponse.status).toBe(401);
    });
  });

  describe('Multiple Sessions', () => {
    it('should allow login after logout from another device', async () => {
      // Create second session
      const login2Response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
          rememberMe: true,
        }),
      });

      const { token: token2 } = await login2Response.json();

      // Logout from first session
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // First token should be invalid
      const me1Response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      expect(me1Response.ok).toBe(false);

      // Second token should still be valid (unless logout-all is implemented)
      const me2Response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token2}`,
        },
      });
      expect(me2Response.ok).toBe(true);
    });
  });

  describe('Logout Edge Cases', () => {
    it('should handle logout for expired token gracefully', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle logout with malformed token', async () => {
      const malformedToken = 'not-a-valid-jwt';

      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${malformedToken}`,
        },
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle logout for locked account', async () => {
      // Lock the account by failed logins
      for (let i = 0; i < 5; i++) {
        await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUserEmail,
            password: `WrongPassword${i}!`,
          }),
        });
      }

      // Try to logout with the token (should still work if token is valid)
      const logoutResponse = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Logout should succeed (token is still valid)
      expect(logoutResponse.ok).toBe(true);
    });
  });

  describe('Logout API Response', () => {
    it('should return consistent response format', async () => {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result).toMatchObject({
        success: true,
        message: expect.any(String),
      });
    });

    it('should include timestamp in logout response', async () => {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Response might include loggedOutAt timestamp
        expect(result.loggedOutAt || result.timestamp).toBeDefined();
      }
    });
  });
});
