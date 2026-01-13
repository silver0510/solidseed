/**
 * Unit Tests: Client Validation
 *
 * Tests Zod validation schemas for client data:
 * - Valid client data
 * - Invalid email format
 * - Invalid phone format
 * - Missing required fields
 */

import { describe, it, expect } from 'vitest';
import { createClientSchema, updateClientSchema } from '@/lib/validation/client';
import { z } from 'zod';

describe('Client Validation Schemas', () => {
  describe('createClientSchema', () => {
    it('should accept valid client data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        birthday: '1990-01-15',
        address: '123 Main St, City, State',
      };

      const result = createClientSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept minimal valid data (name and email only)', () => {
      const minimalData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
      };

      const result = createClientSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Jane Smith');
        expect(result.data.email).toBe('jane@example.com');
      }
    });

    it('should reject invalid email format', () => {
      const invalidEmail = {
        name: 'John Doe',
        email: 'not-an-email',
      };

      const result = createClientSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject invalid phone format (missing +1 prefix)', () => {
      const invalidPhone = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
      };

      const result = createClientSchema.safeParse(invalidPhone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('+1-XXX-XXX-XXXX');
      }
    });

    it('should reject invalid phone format (wrong structure)', () => {
      const invalidPhone = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-5551234567',
      };

      const result = createClientSchema.safeParse(invalidPhone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('+1-XXX-XXX-XXXX');
      }
    });

    it('should reject missing name field', () => {
      const missingName = {
        email: 'john@example.com',
      };

      const result = createClientSchema.safeParse(missingName);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find(issue => issue.path[0] === 'name');
        expect(nameError).toBeDefined();
      }
    });

    it('should reject empty name field', () => {
      const emptyName = {
        name: '',
        email: 'john@example.com',
      };

      const result = createClientSchema.safeParse(emptyName);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Name is required');
      }
    });

    it('should reject missing email field', () => {
      const missingEmail = {
        name: 'John Doe',
      };

      const result = createClientSchema.safeParse(missingEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(issue => issue.path[0] === 'email');
        expect(emailError).toBeDefined();
      }
    });

    it('should accept valid phone with different area codes', () => {
      const testCases = [
        '+1-212-555-1234',
        '+1-415-555-9876',
        '+1-800-123-4567',
      ];

      testCases.forEach(phone => {
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          phone,
        };

        const result = createClientSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('updateClientSchema', () => {
    it('should accept partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
      };

      const result = updateClientSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no updates)', () => {
      const emptyUpdate = {};

      const result = updateClientSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate email format when provided', () => {
      const invalidEmail = {
        email: 'not-an-email',
      };

      const result = updateClientSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should validate phone format when provided', () => {
      const invalidPhone = {
        phone: '555-123-4567',
      };

      const result = updateClientSchema.safeParse(invalidPhone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('+1-XXX-XXX-XXXX');
      }
    });
  });
});
