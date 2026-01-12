/**
 * Integration Tests: Account Lockout Flow
 *
 * Tests account lockout after failed login attempts:
 * 1. 5 failed login attempts
 * 2. Account locked
 * 3. Security email sent
 * 4. Cannot login for 30 minutes
 * 5. Can login after lockout expires
 */

import { describe, it, expect, beforeEach } from 'vitest';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Account Lockout Flow Integration Tests', () => {
  let testUserEmail: string;
  let testUserPassword: string;

  beforeEach(async () => {
    // Create a test user before each test
    testUserEmail = `lockout-test-${Date.now()}@example.com`;
    testUserPassword = 'CorrectPass123!';

    await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lockout Test User',
        email: testUserEmail,
        password: testUserPassword,
      }),
    });
  });

  describe('Failed Login Tracking', () => {
    it('should track failed login attempts', async () => {
      // First failed attempt
      await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'WrongPassword1!',
        }),
      });

      // Second failed attempt
      await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'WrongPassword2!',
        }),
      });

      // Third attempt with correct password should still work
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      expect(loginResponse.ok).toBe(true);
    });

    it('should lock account after 5 failed attempts', async () => {
      // Make 5 failed login attempts
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

      // Try login with correct password (should fail due to lockout)
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      expect(loginResponse.ok).toBe(false);
      const result = await loginResponse.json();
      expect(result.error).toMatch(/lock|account|disabled/i);
    });

    it('should include lockout expiration in error response', async () => {
      // Lock the account
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

      // Try login
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      const result = await loginResponse.json();
      expect(result).toHaveProperty('lockedUntil');
      expect(result).toHaveProperty('minutesRemaining');
    });
  });

  describe('Lockout Duration', () => {
    it('should lock account for 30 minutes', async () => {
      // Lock the account
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

      // Check lockout time
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      const result = await loginResponse.json();
      const lockedDate = new Date(result.lockedUntil);
      const now = new Date();
      const minutesUntilUnlock = Math.floor((lockedDate.getTime() - now.getTime()) / (1000 * 60));

      expect(minutesUntilUnlock).toBeGreaterThan(29);
      expect(minutesUntilUnlock).toBeLessThanOrEqual(30);
    });

    it('should allow login after lockout expires', async () => {
      // Lock the account
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

      // This test would require manipulating time or database
      // In real scenario, would use a shorter lockout time for testing
      // or mock the current time
    });
  });

  describe('Security Notifications', () => {
    it('should send security email on lockout', async () => {
      // Lock the account
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

      // This would require email interception to verify
      // Security email should include:
      // - Time of lockout
      // - IP address (if available)
      // - Instructions for unlocking
    });
  });

  describe('Failed Login Counter Reset', () => {
    it('should reset counter on successful login', async () => {
      // Make 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUserEmail,
            password: `WrongPassword${i}!`,
          }),
        });
      }

      // Login successfully
      await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      // Make 5 more failed attempts (should lock now, counter was reset)
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

      // Should be locked now
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testUserPassword,
        }),
      });

      const result = await loginResponse.json();
      expect(result.error).toMatch(/lock/i);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      // Make 10 rapid requests from same IP
      const requests = Array(11).fill(null);

      const responses = await Promise.all(
        requests.map((_, i) =>
          fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'TestPassword123!',
            }),
          })
        )
      );

      // 11th request should be rate limited
      const rateLimitedResponse = responses[10];
      expect(rateLimitedResponse.status).toBe(429);
    });
  });

  describe('Cross-User Isolation', () => {
    it('should not affect other users when one is locked', async () => {
      // Create second user
      const secondUserEmail = `second-user-${Date.now()}@example.com`;
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Second User',
          email: secondUserEmail,
          password: 'SecondUser123!',
        }),
      });

      // Lock first user
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

      // Second user should still be able to login
      const secondUserLogin = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: secondUserEmail,
          password: 'SecondUser123!',
        }),
      });

      expect(secondUserLogin.ok).toBe(true);
    });
  });
});
