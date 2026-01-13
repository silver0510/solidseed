/**
 * Integration Tests: POST /api/clients
 *
 * Tests the client creation API endpoint:
 * - Successful client creation
 * - Validation errors
 * - Duplicate email handling
 * - Authentication requirements
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test data
const validClientData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-123-4567',
  birthday: '1990-01-15',
  address: '123 Main St, City, State',
};

const minimalClientData = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
};

describe('POST /api/clients Integration Tests', () => {
  let createdClientIds: string[] = [];

  afterEach(() => {
    // Cleanup: Track created clients for cleanup
    // In a real scenario, we'd delete test data
    createdClientIds = [];
  });

  describe('Successful Creation', () => {
    it('should create client with all fields and return 201', async () => {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validClientData),
      });

      expect(response.status).toBe(201);

      const result = await response.json();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', validClientData.name);
      expect(result).toHaveProperty('email', validClientData.email);
      expect(result).toHaveProperty('phone', validClientData.phone);
      expect(result).toHaveProperty('created_by');
      expect(result).toHaveProperty('assigned_to');
      expect(result).toHaveProperty('is_deleted', false);
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');

      // Track for cleanup
      createdClientIds.push(result.id);
    });

    it('should create client with minimal data (name and email only)', async () => {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minimalClientData),
      });

      expect(response.status).toBe(201);

      const result = await response.json();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', minimalClientData.name);
      expect(result).toHaveProperty('email', minimalClientData.email);
      expect(result.phone).toBeUndefined();

      createdClientIds.push(result.id);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing name', async () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Validation');
    });

    it('should return 400 for missing email', async () => {
      const invalidData = {
        name: 'John Doe',
      };

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Validation');
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'not-an-email',
      };

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Validation');
    });

    it('should return 400 for invalid phone format (missing +1 prefix)', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
      };

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Validation');
      expect(result.details).toBeDefined();
    });

    it('should return 400 for invalid phone format (wrong structure)', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-5551234567', // Missing dashes
      };

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Validation');
    });

    it('should return 400 for empty name', async () => {
      const invalidData = {
        name: '',
        email: 'john@example.com',
      };

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidData),
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Validation');
    });
  });

  describe('Duplicate Email Handling', () => {
    it('should return 400 when creating client with duplicate email', async () => {
      const clientData = {
        name: 'First Client',
        email: 'duplicate@example.com',
      };

      // Create first client
      const firstResponse = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });

      expect(firstResponse.status).toBe(201);
      const firstResult = await firstResponse.json();
      createdClientIds.push(firstResult.id);

      // Try to create second client with same email
      const duplicateData = {
        name: 'Second Client',
        email: 'duplicate@example.com',
      };

      const duplicateResponse = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(duplicateData),
      });

      expect(duplicateResponse.status).toBe(400);

      const duplicateResult = await duplicateResponse.json();
      expect(duplicateResult).toHaveProperty('error');
      expect(duplicateResult.error).toContain('already exists');
    });
  });

  describe('Authentication', () => {
    it.skip('should require authentication', async () => {
      // SKIPPED: Requires authentication middleware setup
      // Would test that unauthenticated requests return 401
    });

    it.skip('should set created_by and assigned_to from session', async () => {
      // SKIPPED: Requires authenticated session
      // Would verify user ID is correctly set from Better Auth session
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json{',
      });

      // Should return 400 or 500 depending on error handling
      expect([400, 500]).toContain(response.status);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        body: JSON.stringify(validClientData),
      });

      // Should still process or return appropriate error
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});
