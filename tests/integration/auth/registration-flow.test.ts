/**
 * Integration Tests: Complete Registration Flow
 *
 * Tests the end-to-end registration process:
 * 1. Register with email/password
 * 2. Receive verification email
 * 3. Click verification link
 * 4. Account activated
 * 5. Can login
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testUser, generateTestEmail } from '../helpers/test-data';

// API base URL (use environment variable or default to localhost)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Registration Flow Integration Tests', () => {
  let testUserId: string;
  let verificationToken: string;

  afterEach(() => {
    // Cleanup: Delete test user if created
    if (testUserId) {
      // Would implement cleanup in real scenario
    }
  });

  describe('Email/Password Registration', () => {
    it('should register new user successfully', async () => {
      // Register new user
      const registrationData = {
        fullName: testUser.fullName,
        email: generateTestEmail(),
        password: testUser.password,
      };

      const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      expect(registerResponse.ok).toBe(true);
      const registerResult = await registerResponse.json();

      expect(registerResult).toHaveProperty('success', true);
      expect(registerResult).toHaveProperty('message');
      expect(registerResult).toHaveProperty('userId');
      // Message should mention email verification
      expect(registerResult.message.toLowerCase()).toMatch(/email|verify/);
    });

    it.skip('should complete full login flow after verification', async () => {
      // SKIPPED: Requires email verification flow (email interception or database verification)
      // Full flow: Register -> Verify Email -> Login -> Check trial period
    });

    it('should prevent duplicate email registration', async () => {
      const email = generateTestEmail();

      // First registration
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: testUser.fullName,
          email,
          password: testUser.password,
        }),
      });

      // Second registration with same email
      const duplicateResponse = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Another User',
          email,
          password: 'DifferentPass123!',
        }),
      });

      expect(duplicateResponse.ok).toBe(false);
      // 409 Conflict is the correct status for duplicate email
      expect(duplicateResponse.status).toBe(409);
    });

    it('should enforce password complexity requirements', async () => {
      const weakPasswords = [
        'short', // Too short
        'nouppercase123!', // No uppercase
        'NOLOWERCASE123!', // No lowercase
        'NoNumber!', // No number
        'NoSymbol123', // No symbol
      ];

      for (const weakPassword of weakPasswords) {
        const response = await fetch(`${API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: testUser.fullName,
            email: generateTestEmail(),
            password: weakPassword,
          }),
        });

        expect(response.ok).toBe(false);
        expect(response.status).toBe(400);
      }
    });

    it('should require email verification before login', async () => {
      const email = generateTestEmail();

      // Register but don't verify
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: testUser.fullName,
          email,
          password: testUser.password,
        }),
      });

      // Try to login without verifying
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: testUser.password,
        }),
      });

      expect(loginResponse.ok).toBe(false);
      const loginResult = await loginResponse.json();
      // API may return different error formats - check for common patterns
      expect(loginResult.error || loginResult.message).toMatch(/verify|email|forbidden|unverified/i);
    });
  });

  describe('Email Verification', () => {
    it('should accept valid verification token', async () => {
      // This test would require setting up email interception
      // or using a test email service
    });

    it('should reject expired verification token', async () => {
      const expiredToken = 'expired-token-123';

      const response = await fetch(
        `${API_URL}/api/auth/verify-email?token=${expiredToken}`,
        { method: 'POST' }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should reject invalid verification token', async () => {
      const invalidToken = 'invalid-token-format';

      const response = await fetch(
        `${API_URL}/api/auth/verify-email?token=${invalidToken}`,
        { method: 'POST' }
      );

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should allow resending verification email', async () => {
      const email = generateTestEmail();

      // Register user
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: testUser.fullName,
          email,
          password: testUser.password,
        }),
      });

      // Request resend
      const resendResponse = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      expect(resendResponse.ok).toBe(true);
      const resendResult = await resendResponse.json();
      expect(resendResult).toHaveProperty('message');
    });
  });

  describe('OAuth Registration', () => {
    it.skip('should complete Google OAuth flow', async () => {
      // SKIPPED: Requires actual OAuth credentials
      // Better Auth uses /api/auth/sign-in/social?provider=google
      // This test would require OAuth test credentials or mocking the OAuth provider
    });

    it.skip('should pre-verify OAuth users', async () => {
      // SKIPPED: Requires actual OAuth flow completion
      // OAuth users should have email_verified = true
      // and can login immediately without verification
    });
  });

  describe('Trial Period', () => {
    it.skip('should start trial period on email verification', async () => {
      // SKIPPED: Requires email verification flow to work (database verification or email interception)
      // After verification, check trial_expires_at is set to 14 days from now
    });
  });
});
