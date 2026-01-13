/**
 * Integration Tests: GET/PATCH/DELETE /api/clients/:id
 *
 * Tests individual client operations:
 * - GET /api/clients/:id - Retrieve client with related counts
 * - PATCH /api/clients/:id - Update client
 * - DELETE /api/clients/:id - Soft delete client
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

describe('GET /api/clients/:id', () => {
  let testClientId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user and client
    const { data: authData } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    authToken = authData.session?.access_token || '';

    // Create a test client
    const createResponse = await fetch(`${process.env.APP_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+1-555-123-4567',
      }),
    });

    const client = await createResponse.json();
    testClientId = client.id;
  });

  afterEach(async () => {
    // Cleanup
    if (testClientId) {
      await supabase.from('clients').delete().eq('id', testClientId);
    }
  });

  it('should return 200 with full client profile', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(200);

    const client = await response.json();
    expect(client).toMatchObject({
      id: testClientId,
      name: 'Test Client',
      email: 'test@example.com',
      phone: '+1-555-123-4567',
    });
    expect(client).toHaveProperty('documents_count');
    expect(client).toHaveProperty('notes_count');
    expect(client).toHaveProperty('tasks_count');
  });

  it('should include related data counts', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const client = await response.json();
    expect(typeof client.documents_count).toBe('number');
    expect(typeof client.notes_count).toBe('number');
    expect(typeof client.tasks_count).toBe('number');
  });

  it('should return 404 for non-existent client', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/non_existent_id`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(404);

    const error = await response.json();
    expect(error).toHaveProperty('error', 'Client not found');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'GET',
    });

    expect(response.status).toBe(401);
  });

  it('should respect RLS policies (user can only access own clients)', async () => {
    // Create second user
    const { data: otherAuthData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    const otherToken = otherAuthData.session?.access_token || '';

    // Try to access first user's client
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${otherToken}`,
      },
    });

    // Should return 404 (not 403) due to RLS filtering
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/clients/:id', () => {
  let testClientId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user and client
    const { data: authData } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    authToken = authData.session?.access_token || '';

    const createResponse = await fetch(`${process.env.APP_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Original Name',
        email: 'original@example.com',
      }),
    });

    const client = await createResponse.json();
    testClientId = client.id;
  });

  afterEach(async () => {
    if (testClientId) {
      await supabase.from('clients').delete().eq('id', testClientId);
    }
  });

  it('should return 200 with updated client', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Updated Name',
        phone: '+1-555-999-8888',
      }),
    });

    expect(response.status).toBe(200);

    const client = await response.json();
    expect(client).toMatchObject({
      id: testClientId,
      name: 'Updated Name',
      email: 'original@example.com', // Unchanged
      phone: '+1-555-999-8888',
    });
  });

  it('should validate update data with Zod schema', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        email: 'invalid-email', // Invalid format
      }),
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error', 'Validation failed');
    expect(error).toHaveProperty('details');
  });

  it('should return 404 for non-existent client', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/non_existent_id`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'New Name',
      }),
    });

    expect(response.status).toBe(404);

    const error = await response.json();
    expect(error).toHaveProperty('error', 'Client not found');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Name',
      }),
    });

    expect(response.status).toBe(401);
  });

  it('should respect RLS policies (user can only update own clients)', async () => {
    // Create second user
    const { data: otherAuthData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    const otherToken = otherAuthData.session?.access_token || '';

    // Try to update first user's client
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherToken}`,
      },
      body: JSON.stringify({
        name: 'Hacked Name',
      }),
    });

    // Should return 404 due to RLS filtering
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/clients/:id', () => {
  let testClientId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    const { data: authData } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    authToken = authData.session?.access_token || '';
  });

  afterEach(async () => {
    if (testClientId) {
      // Hard delete for cleanup
      await supabase.from('clients').delete().eq('id', testClientId);
    }
  });

  it('should return 204 on success', async () => {
    // Create client
    const createResponse = await fetch(`${process.env.APP_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'To Delete',
        email: 'delete@example.com',
      }),
    });

    const client = await createResponse.json();
    testClientId = client.id;

    // Delete client
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe(''); // No content
  });

  it('should soft delete (set is_deleted = true)', async () => {
    // Create client
    const createResponse = await fetch(`${process.env.APP_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'To Soft Delete',
        email: 'softdelete@example.com',
      }),
    });

    const client = await createResponse.json();
    testClientId = client.id;

    // Soft delete
    await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // Verify client still exists but is soft deleted
    const { data: deletedClient } = await supabase
      .from('clients')
      .select('*')
      .eq('id', testClientId)
      .single();

    expect(deletedClient).toBeDefined();
    expect(deletedClient?.is_deleted).toBe(true);
  });

  it('should return 404 for non-existent client', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/non_existent_id`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(404);

    const error = await response.json();
    expect(error).toHaveProperty('error', 'Client not found');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await fetch(`${process.env.APP_URL}/api/clients/some_id`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(401);
  });

  it('should respect RLS policies (user can only delete own clients)', async () => {
    // Create client with first user
    const createResponse = await fetch(`${process.env.APP_URL}/api/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Protected Client',
        email: 'protected@example.com',
      }),
    });

    const client = await createResponse.json();
    testClientId = client.id;

    // Create second user
    const { data: otherAuthData } = await supabase.auth.signUp({
      email: `other-${Date.now()}@example.com`,
      password: 'TestPassword123!',
    });

    const otherToken = otherAuthData.session?.access_token || '';

    // Try to delete first user's client
    const response = await fetch(`${process.env.APP_URL}/api/clients/${testClientId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${otherToken}`,
      },
    });

    // Should return 404 due to RLS filtering
    expect(response.status).toBe(404);

    // Verify client still exists
    const { data: stillExists } = await supabase
      .from('clients')
      .select('*')
      .eq('id', testClientId)
      .single();

    expect(stillExists).toBeDefined();
    expect(stillExists?.is_deleted).toBe(false);
  });
});
