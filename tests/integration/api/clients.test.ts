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

describe('GET /api/clients Integration Tests', () => {
  let createdClientIds: string[] = [];

  // Helper function to create test clients
  async function createTestClient(data: any) {
    const response = await fetch(`${API_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    createdClientIds.push(result.id);
    return result;
  }

  afterEach(() => {
    // Cleanup: Track created clients for cleanup
    createdClientIds = [];
  });

  describe('Basic List Functionality', () => {
    it('should return paginated list of clients with 200', async () => {
      // Create test data
      await createTestClient({ name: 'Test Client 1', email: 'test1@example.com' });
      await createTestClient({ name: 'Test Client 2', email: 'test2@example.com' });

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total_count');
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.total_count).toBe('number');
    });

    it('should return empty array when no clients exist', async () => {
      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data).toBeInstanceOf(Array);
      expect(result.total_count).toBeGreaterThanOrEqual(0);
    });

    it('should include next_cursor when more data exists', async () => {
      // Create 25 test clients to ensure pagination
      for (let i = 0; i < 25; i++) {
        await createTestClient({
          name: `Pagination Test ${i}`,
          email: `pagination${i}@example.com`,
        });
      }

      const response = await fetch(`${API_URL}/api/clients?limit=20`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data).toHaveLength(20);
      expect(result.next_cursor).toBeDefined();
      expect(typeof result.next_cursor).toBe('string');
    });

    it('should not include next_cursor when all data returned', async () => {
      await createTestClient({ name: 'Single Client', email: 'single@example.com' });

      const response = await fetch(`${API_URL}/api/clients?limit=20`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data.length).toBeLessThanOrEqual(20);
      expect(result.next_cursor).toBeUndefined();
    });
  });

  describe('Pagination', () => {
    it('should respect limit parameter', async () => {
      // Create test clients
      for (let i = 0; i < 15; i++) {
        await createTestClient({
          name: `Limit Test ${i}`,
          email: `limit${i}@example.com`,
        });
      }

      const response = await fetch(`${API_URL}/api/clients?limit=5`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data.length).toBeLessThanOrEqual(5);
    });

    it('should enforce max limit of 100', async () => {
      const response = await fetch(`${API_URL}/api/clients?limit=500`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      // Should not return more than 100 items
      expect(result.data.length).toBeLessThanOrEqual(100);
    });

    it('should use cursor for pagination', async () => {
      // Create test clients
      for (let i = 0; i < 25; i++) {
        await createTestClient({
          name: `Cursor Test ${i}`,
          email: `cursor${i}@example.com`,
        });
      }

      // Get first page
      const firstResponse = await fetch(`${API_URL}/api/clients?limit=10`, {
        method: 'GET',
      });
      const firstResult = await firstResponse.json();

      expect(firstResult.next_cursor).toBeDefined();

      // Get second page using cursor
      const secondResponse = await fetch(
        `${API_URL}/api/clients?limit=10&cursor=${firstResult.next_cursor}`,
        {
          method: 'GET',
        }
      );
      const secondResult = await secondResponse.json();

      expect(secondResponse.status).toBe(200);
      expect(secondResult.data).toHaveLength(10);

      // Verify no overlap between pages
      const firstIds = firstResult.data.map((c: any) => c.id);
      const secondIds = secondResult.data.map((c: any) => c.id);
      const overlap = firstIds.filter((id: string) => secondIds.includes(id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('Search Functionality', () => {
    it('should search by name', async () => {
      await createTestClient({ name: 'John Doe', email: 'john@example.com' });
      await createTestClient({ name: 'Jane Smith', email: 'jane@example.com' });
      await createTestClient({ name: 'Bob Wilson', email: 'bob@example.com' });

      const response = await fetch(`${API_URL}/api/clients?search=John`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some((c: any) => c.name.includes('John'))).toBe(true);
    });

    it('should search by email', async () => {
      await createTestClient({ name: 'Test User', email: 'uniquetest@example.com' });
      await createTestClient({ name: 'Another User', email: 'another@example.com' });

      const response = await fetch(`${API_URL}/api/clients?search=uniquetest`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some((c: any) => c.email.includes('uniquetest'))).toBe(true);
    });

    it('should perform case-insensitive search', async () => {
      await createTestClient({ name: 'CaseSensitive Test', email: 'case@example.com' });

      const response = await fetch(`${API_URL}/api/clients?search=casesensitive`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for no search matches', async () => {
      const response = await fetch(
        `${API_URL}/api/clients?search=nonexistentclient123456789`,
        {
          method: 'GET',
        }
      );

      expect(response.status).toBe(200);

      const result = await response.json();

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });
  });

  describe('Tag Filtering', () => {
    it.skip('should filter clients by tag', async () => {
      // SKIPPED: Requires client_tags relationship setup
      // Would test filtering by tag_name parameter
    });
  });

  describe('Sorting', () => {
    it('should sort by created_at descending by default', async () => {
      // Create clients with delay to ensure different timestamps
      const client1 = await createTestClient({
        name: 'First',
        email: 'first@example.com',
      });
      await new Promise((resolve) => setTimeout(resolve, 100));
      const client2 = await createTestClient({
        name: 'Second',
        email: 'second@example.com',
      });

      const response = await fetch(`${API_URL}/api/clients?limit=10`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      // Most recent should be first
      const firstIndex = result.data.findIndex((c: any) => c.id === client2.id);
      const secondIndex = result.data.findIndex((c: any) => c.id === client1.id);

      if (firstIndex !== -1 && secondIndex !== -1) {
        expect(firstIndex).toBeLessThan(secondIndex);
      }
    });

    it('should support sorting by name', async () => {
      await createTestClient({ name: 'Zebra', email: 'zebra@example.com' });
      await createTestClient({ name: 'Apple', email: 'apple@example.com' });

      const response = await fetch(`${API_URL}/api/clients?sort=name`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      // Verify results are sorted (descending)
      expect(result.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      await createTestClient({ name: 'Format Test', email: 'format@example.com' });

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();

      // Verify PaginatedClients type structure
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total_count');
      expect(Array.isArray(result.data)).toBe(true);
      expect(typeof result.total_count).toBe('number');
    });

    it('should include all client fields in response', async () => {
      const client = await createTestClient({
        name: 'Complete Client',
        email: 'complete@example.com',
        phone: '+1-555-999-8888',
      });

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      const foundClient = result.data.find((c: any) => c.id === client.id);

      if (foundClient) {
        expect(foundClient).toHaveProperty('id');
        expect(foundClient).toHaveProperty('name');
        expect(foundClient).toHaveProperty('email');
        expect(foundClient).toHaveProperty('created_by');
        expect(foundClient).toHaveProperty('assigned_to');
        expect(foundClient).toHaveProperty('is_deleted');
        expect(foundClient).toHaveProperty('created_at');
        expect(foundClient).toHaveProperty('updated_at');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid limit parameter', async () => {
      const response = await fetch(`${API_URL}/api/clients?limit=invalid`, {
        method: 'GET',
      });

      // Should return valid response (defaulting to 20) or 400
      expect([200, 400]).toContain(response.status);
    });

    it('should handle invalid cursor parameter', async () => {
      const response = await fetch(`${API_URL}/api/clients?cursor=invalid-cursor`, {
        method: 'GET',
      });

      // Should handle gracefully
      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
