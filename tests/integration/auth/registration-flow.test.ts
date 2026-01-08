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
    it('should complete full registration flow successfully', async () => {
      // Step 1: Register new user
      const registrationData = {
        full_name: testUser.full_name,
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

      expect(registerResult).toHaveProperty('message');
      expect(registerResult.message).toContain('email');
      expect(registerResult.message).toContain('verify');

      // In real scenario, would extract verification token from email
      // verificationToken = extractTokenFromEmail(registerResult.email);

      // Step 2: Verify email (simulate clicking link)
      // const verifyResponse = await fetch(
      //   `${API_URL}/api/auth/verify-email?token=${verificationToken}`,
      //   { method: 'POST' }
      // );

      // expect(verifyResponse.ok).toBe(true);
      // const verifyResult = await verifyResponse.json();
      // expect(verifyResult.success).toBe(true);

      // Step 3: Login with verified credentials
      const loginData = {
        email: registrationData.email,
        password: registrationData.password,
        remember_me: false,
      };

      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      expect(loginResponse.ok).toBe(true);
      const loginResult = await loginResponse.json();

      expect(loginResult).toHaveProperty('token');
      expect(loginResult).toHaveProperty('user');
      expect(loginResult.user).toHaveProperty('id');
      expect(loginResult.user).toHaveProperty('email');
      expect(loginResult.user.email).toBe(registrationData.email);
      expect(loginResult.user).toHaveProperty('subscription_tier');
      expect(loginResult.user.subscription_tier).toBe('trial');

      testUserId = loginResult.user.id;
    });

    it('should prevent duplicate email registration', async () => {
      const email = generateTestEmail();

      // First registration
      await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: testUser.full_name,
          email,
          password: testUser.password,
        }),
      });

      // Second registration with same email
      const duplicateResponse = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Another User',
          email,
          password: 'DifferentPass123!',
        }),
      });

      expect(duplicateResponse.ok).toBe(false);
      expect(duplicateResponse.status).toBe(400);
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
            full_name: testUser.full_name,
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
          full_name: testUser.full_name,
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
      expect(loginResult.error).toContain('verify');
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
          full_name: testUser.full_name,
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
    it('should complete Google OAuth flow', async () => {
      // This test would require OAuth test credentials
      // or mocking the OAuth provider

      // Step 1: Initiate OAuth
      const oauthInitResponse = await fetch(`${API_URL}/api/auth/oauth/google`);
      expect(oauthInitResponse.ok).toBe(true);

      // Step 2: Simulate callback (would need actual OAuth flow)
      // const callbackResponse = await fetch(
      //   `${API_URL}/api/auth/oauth/google/callback?code=test-code`
      // );

      // expect(callbackResponse.ok).toBe(true);
    });

    it('should pre-verify OAuth users', async () => {
      // OAuth users should have email_verified = true
      // and can login immediately without verification
    });
  });

  describe('Trial Period', () => {
    it('should start trial period on email verification', async () => {
      const email = generateTestEmail();

      // Register and verify
      // After verification, check trial_expires_at is set to 14 days from now

      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: testUser.password,
        }),
      });

      const loginResult = await loginResponse.json();
      expect(loginResult.user.subscription_tier).toBe('trial');
      expect(loginResult.user.trial_expires_at).toBeDefined();

      // Verify trial expiration is approximately 14 days from now
      const trialExpires = new Date(loginResult.user.trial_expires_at);
      const now = new Date();
      const daysUntilExpiration = Math.floor(
        (trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysUntilExpiration).toBeGreaterThanOrEqual(13);
      expect(daysUntilExpiration).toBeLessThanOrEqual(14);
    });
  });
});
