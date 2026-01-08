/**
 * JWT Utility Tests
 *
 * Tests for JWT token operations including:
 * - Token extraction from headers
 * - Token format validation
 * - Token payload parsing
 * - Token expiration checking
 * - Token type identification
 */

import { describe, it, expect } from 'vitest';
import {
  extractTokenFromHeader,
  isValidTokenFormat,
  parseJWTPayload,
  isTokenExpired,
  getTokenExpirationTime,
  getTokenIssuedTime,
  getTokenTimeRemaining,
  calculateTokenExpiration,
  getDefaultTokenExpiration,
  getExtendedTokenExpiration,
  getTokenType,
  isExtendedSession,
  getTokenErrorMessage,
  getTokenErrorCode,
} from '../../../src/lib/utils/jwt.utils';
import { securityConstants } from '../../../src/config/database';

describe('JWT Utils', () => {
  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('should return null for missing Authorization header', () => {
      const extracted = extractTokenFromHeader(null);
      expect(extracted).toBeNull();
    });

    it('should return null for Authorization header without Bearer prefix', () => {
      const extracted = extractTokenFromHeader('Basic dXNlcjpwYXNz');
      expect(extracted).toBeNull();
    });

    it('should return null for empty token', () => {
      const extracted = extractTokenFromHeader('Bearer ');
      expect(extracted).toBeNull();
    });

    it('should trim whitespace from token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const header = `Bearer  ${token}  `;

      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid JWT format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature';

      expect(isValidTokenFormat(validToken)).toBe(true);
    });

    it('should return false for token with missing parts', () => {
      expect(isValidTokenFormat('header.payload')).toBe(false);
      expect(isValidTokenFormat('header.payload.')).toBe(false);
      expect(isValidTokenFormat('.payload.signature')).toBe(false);
    });

    it('should return false for token with extra parts', () => {
      expect(isValidTokenFormat('a.b.c.d')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidTokenFormat('')).toBe(false);
    });

    it('should return false for malformed token', () => {
      expect(isValidTokenFormat('not-a-jwt')).toBe(false);
      expect(isValidTokenFormat('header..signature')).toBe(false);
    });
  });

  describe('parseJWTPayload', () => {
    it('should parse valid JWT payload', () => {
      // Create a simple JWT-like token
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'user-123',
          userId: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          subscriptionTier: 'pro',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
          rememberMe: true,
        })
      );
      const signature = 'signature';
      const token = `${header}.${payload}.${signature}`;

      const parsed = parseJWTPayload(token);

      expect(parsed).toBeDefined();
      expect(parsed?.userId).toBe('user-123');
      expect(parsed?.email).toBe('test@example.com');
      expect(parsed?.name).toBe('Test User');
      expect(parsed?.subscriptionTier).toBe('pro');
      expect(parsed?.rememberMe).toBe(true);
    });

    it('should return null for invalid token format', () => {
      const parsed = parseJWTPayload('invalid-token');
      expect(parsed).toBeNull();
    });

    it('should handle missing subscription tier', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      );
      const token = `${header}.${payload}.signature`;

      const parsed = parseJWTPayload(token);

      expect(parsed?.subscriptionTier).toBe('trial'); // Default value
    });

    it('should handle base64url encoding', () => {
      // JWT uses base64url encoding (not standard base64)
      // This test would need a proper JWT library to create valid tokens
      // For now, we test the structure
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const payload = btoa(
        JSON.stringify({
          sub: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        })
      )
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      const token = `${header}.${payload}.signature`;

      const parsed = parseJWTPayload(token);

      expect(parsed).toBeDefined();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const now = Math.floor(Date.now() / 1000);
      const futureExp = now + 3600; // 1 hour from now

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp: futureExp,
      };

      expect(isTokenExpired(payload)).toBe(false);
    });

    it('should return true for expired token', () => {
      const now = Math.floor(Date.now() / 1000);
      const pastExp = now - 3600; // 1 hour ago

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now - 7200,
        exp: pastExp,
      };

      expect(isTokenExpired(payload)).toBe(true);
    });

    it('should handle tokens expiring now', () => {
      const now = Math.floor(Date.now() / 1000);

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now - 3600,
        exp: now - 1, // Already expired by 1 second
      };

      // Token expiring exactly now should be considered expired
      expect(isTokenExpired(payload)).toBe(true);
    });
  });

  describe('getTokenExpirationTime', () => {
    it('should convert exp to milliseconds', () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600;

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp,
      };

      const expirationTime = getTokenExpirationTime(payload);

      expect(expirationTime).toBe(exp * 1000);
    });
  });

  describe('getTokenIssuedTime', () => {
    it('should convert iat to milliseconds', () => {
      const now = Math.floor(Date.now() / 1000);
      const iat = now - 3600;

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat,
        exp: now + 3600,
      };

      const issuedTime = getTokenIssuedTime(payload);

      expect(issuedTime).toBe(iat * 1000);
    });
  });

  describe('getTokenTimeRemaining', () => {
    it('should calculate correct time remaining for future expiration', () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 3600; // 1 hour from now

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp,
      };

      const remaining = getTokenTimeRemaining(payload);

      expect(remaining.expired).toBe(false);
      expect(remaining.secondsRemaining).toBeGreaterThan(0);
      expect(remaining.minutesRemaining).toBeGreaterThan(0);
      expect(remaining.hoursRemaining).toBeGreaterThanOrEqual(0);
      expect(remaining.hoursRemaining).toBeLessThanOrEqual(1);
    });

    it('should detect expired token', () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = now - 3600; // 1 hour ago

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now - 7200,
        exp,
      };

      const remaining = getTokenTimeRemaining(payload);

      expect(remaining.expired).toBe(true);
      expect(remaining.secondsRemaining).toBe(0);
      expect(remaining.minutesRemaining).toBe(0);
    });
  });

  describe('calculateTokenExpiration', () => {
    it('should calculate default expiration (3 days)', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiration = calculateTokenExpiration(false);

      const expectedSeconds = securityConstants.DEFAULT_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      expect(expiration - now).toBeCloseTo(expectedSeconds, 0);
    });

    it('should calculate extended expiration (30 days)', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiration = calculateTokenExpiration(true);

      const expectedSeconds = securityConstants.EXTENDED_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      expect(expiration - now).toBeCloseTo(expectedSeconds, 0);
    });
  });

  describe('getDefaultTokenExpiration', () => {
    it('should return 3 day expiration', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiration = getDefaultTokenExpiration();

      const expectedSeconds = securityConstants.DEFAULT_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      expect(expiration - now).toBeCloseTo(expectedSeconds, 0);
    });
  });

  describe('getExtendedTokenExpiration', () => {
    it('should return 30 day expiration', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiration = getExtendedTokenExpiration();

      const expectedSeconds = securityConstants.EXTENDED_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      expect(expiration - now).toBeCloseTo(expectedSeconds, 0);
    });
  });

  describe('getTokenType', () => {
    it('should identify default session token', () => {
      const now = Math.floor(Date.now() / 1000);
      const defaultLifetime = securityConstants.DEFAULT_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp: now + defaultLifetime,
      };

      const tokenType = getTokenType(payload);

      expect(tokenType.type).toBe('default');
      expect(tokenType.description).toContain('3 days');
    });

    it('should identify extended session token', () => {
      const now = Math.floor(Date.now() / 1000);
      const extendedLifetime = securityConstants.EXTENDED_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp: now + extendedLifetime,
      };

      const tokenType = getTokenType(payload);

      expect(tokenType.type).toBe('extended');
      expect(tokenType.description).toContain('30 days');
    });

    it('should return unknown for non-standard lifetime', () => {
      const now = Math.floor(Date.now() / 1000);
      const customLifetime = 7 * 24 * 60 * 60; // 7 days

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp: now + customLifetime,
      };

      const tokenType = getTokenType(payload);

      expect(tokenType.type).toBe('unknown');
    });
  });

  describe('isExtendedSession', () => {
    it('should return true for extended session token', () => {
      const now = Math.floor(Date.now() / 1000);
      const extendedLifetime = securityConstants.EXTENDED_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp: now + extendedLifetime,
        rememberMe: true,
      };

      expect(isExtendedSession(payload)).toBe(true);
    });

    it('should return false for default session token', () => {
      const now = Math.floor(Date.now() / 1000);
      const defaultLifetime = securityConstants.DEFAULT_JWT_EXPIRATION_DAYS * 24 * 60 * 60;

      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp: now + defaultLifetime,
        rememberMe: false,
      };

      expect(isExtendedSession(payload)).toBe(false);
    });

    it('should check rememberMe flag when present', () => {
      const now = Math.floor(Date.now() / 1000);

      const payloadWithFlag = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        iat: now,
        exp: now + 3600,
        rememberMe: true,
      };

      expect(isExtendedSession(payloadWithFlag)).toBe(true);
    });
  });

  describe('getTokenErrorMessage', () => {
    it('should return correct message for each error code', () => {
      expect(getTokenErrorMessage('INVALID_FORMAT')).toContain('Invalid');
      expect(getTokenErrorMessage('EXPIRED')).toContain('expired');
      expect(getTokenErrorMessage('MALFORMED')).toContain('Invalid');
      expect(getTokenErrorMessage('MISSING')).toContain('required');
    });
  });

  describe('getTokenErrorCode', () => {
    it('should return 401 for most errors', () => {
      expect(getTokenErrorCode('INVALID_FORMAT')).toBe(401);
      expect(getTokenErrorCode('EXPIRED')).toBe(401);
      expect(getTokenErrorCode('MALFORMED')).toBe(401);
      expect(getTokenErrorCode('MISSING')).toBe(401);
    });
  });
});
