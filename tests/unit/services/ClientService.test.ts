/**
 * Unit Tests: ClientService
 *
 * Tests ClientService database operations:
 * - Client creation with CUID generation
 * - Authentication integration
 * - Unique constraint violations
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// Mock Setup - Must be before imports
// =============================================================================

const {
  mockSupabaseFrom,
  mockSupabaseAuth,
  mockSupabaseClient,
} = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();

  const mockSupabaseFrom = vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    single: mockSingle,
  }));

  const mockSupabaseAuth = {
    getUser: vi.fn(),
  };

  const mockSupabaseClient = {
    from: mockSupabaseFrom,
    auth: mockSupabaseAuth,
  };

  return {
    mockSupabaseFrom,
    mockSupabaseAuth,
    mockSupabaseClient,
    mockInsert,
    mockSelect,
    mockSingle,
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Import after mock
import { ClientService } from '@/services/ClientService';
import type { CreateClientInput } from '@/lib/types/client';

describe('ClientService Foundation', () => {
  it('should instantiate successfully', () => {
    const service = new ClientService();
    expect(service).toBeInstanceOf(ClientService);
  });

  it('should have Supabase client initialized', () => {
    const service = new ClientService();
    // Check that the service has the supabase property
    expect(service).toHaveProperty('supabase');
  });
});

describe('ClientService.createClient', () => {
  let service: ClientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClientService();
  });

  it('should create a client with valid data', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const clientInput: CreateClientInput = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-123-4567',
    };

    const expectedClient = {
      id: expect.stringMatching(/^[a-z0-9]+$/), // CUID format
      ...clientInput,
      created_by: 'user_123',
      assigned_to: 'user_123',
      is_deleted: false,
      created_at: '2026-01-13T00:00:00Z',
      updated_at: '2026-01-13T00:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedClient,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.createClient(clientInput);

    // Verify
    expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    expect(mockSupabaseFrom).toHaveBeenCalledWith('clients');
    expect(result).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-123-4567',
      created_by: 'user_123',
      assigned_to: 'user_123',
    });
    expect(result.id).toBeDefined();
  });

  it('should generate a CUID for new client', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const clientInput: CreateClientInput = {
      name: 'Jane Smith',
      email: 'jane@example.com',
    };

    const expectedClient = {
      id: 'cuid_abc123',
      ...clientInput,
      created_by: 'user_123',
      assigned_to: 'user_123',
      is_deleted: false,
      created_at: '2026-01-13T00:00:00Z',
      updated_at: '2026-01-13T00:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedClient,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.createClient(clientInput);

    // Verify CUID was generated (should be a string)
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  it('should set created_by and assigned_to from authenticated user', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_456',
          email: 'agent@example.com',
        },
      },
    };

    const clientInput: CreateClientInput = {
      name: 'Bob Wilson',
      email: 'bob@example.com',
    };

    const expectedClient = {
      id: 'cuid_xyz789',
      ...clientInput,
      created_by: 'user_456',
      assigned_to: 'user_456',
      is_deleted: false,
      created_at: '2026-01-13T00:00:00Z',
      updated_at: '2026-01-13T00:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedClient,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.createClient(clientInput);

    // Verify user fields are set
    expect(result.created_by).toBe('user_456');
    expect(result.assigned_to).toBe('user_456');
  });

  it('should throw error when user is not authenticated', async () => {
    const mockNoUser = {
      data: {
        user: null,
      },
    };

    const clientInput: CreateClientInput = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    // Setup mock
    mockSupabaseAuth.getUser.mockResolvedValue(mockNoUser);

    // Execute and verify
    await expect(service.createClient(clientInput)).rejects.toThrow('Not authenticated');
  });

  it('should handle duplicate email error (unique constraint violation)', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const clientInput: CreateClientInput = {
      name: 'John Doe',
      email: 'duplicate@example.com',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '23505', // Postgres unique constraint violation
          message: 'duplicate key value violates unique constraint',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute and verify
    await expect(service.createClient(clientInput)).rejects.toThrow('Email or phone already exists');
  });

  it('should handle generic database errors', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const clientInput: CreateClientInput = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42000',
          message: 'Database connection failed',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute and verify
    await expect(service.createClient(clientInput)).rejects.toThrow('Database connection failed');
  });
});

describe('ClientService.listClients', () => {
  let service: ClientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClientService();
  });

  // Helper to create complete mock chain with all methods
  const createMockChain = (resolvedValue: any) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(resolvedValue),
    lt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
  });

  describe('Pagination', () => {
    it('should use default limit of 20 items', async () => {
      const mockClients = Array.from({ length: 20 }, (_, i) => ({
        id: `client_${i}`,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        created_by: 'user_123',
        assigned_to: 'user_123',
        is_deleted: false,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        updated_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 100,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.listClients({});

      expect(mockChain.limit).toHaveBeenCalledWith(20);
      expect(result.data).toHaveLength(20);
      expect(result.total_count).toBe(100);
    });

    it('should respect custom limit parameter', async () => {
      const mockClients = Array.from({ length: 10 }, (_, i) => ({
        id: `client_${i}`,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        created_by: 'user_123',
        assigned_to: 'user_123',
        is_deleted: false,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        updated_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 50,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.listClients({ limit: 10 });

      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(result.data).toHaveLength(10);
    });

    it('should enforce max limit of 100 items', async () => {
      const mockClients = Array.from({ length: 100 }, (_, i) => ({
        id: `client_${i}`,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        created_by: 'user_123',
        assigned_to: 'user_123',
        is_deleted: false,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        updated_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 500,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      // Request 200 but should get capped at 100
      const result = await service.listClients({ limit: 200 });

      expect(mockChain.limit).toHaveBeenCalledWith(100);
      expect(result.data).toHaveLength(100);
    });

    it('should use cursor for pagination', async () => {
      const cursor = '2026-01-10T10:00:00Z';
      const mockClients = Array.from({ length: 20 }, (_, i) => ({
        id: `client_${i}`,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        created_by: 'user_123',
        assigned_to: 'user_123',
        is_deleted: false,
        created_at: new Date(Date.now() - (i + 100) * 1000).toISOString(),
        updated_at: new Date(Date.now() - (i + 100) * 1000).toISOString(),
      }));

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 100,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      await service.listClients({ cursor });

      expect(mockChain.lt).toHaveBeenCalledWith('created_at', cursor);
    });

    it('should return next_cursor when more data exists', async () => {
      const mockClients = Array.from({ length: 20 }, (_, i) => ({
        id: `client_${i}`,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        created_by: 'user_123',
        assigned_to: 'user_123',
        is_deleted: false,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        updated_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 100, // More items exist
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.listClients({ limit: 20 });

      // next_cursor should be the created_at of the last item
      expect(result.next_cursor).toBe(mockClients[19].created_at);
    });

    it('should not return next_cursor when no more data exists', async () => {
      const mockClients = Array.from({ length: 15 }, (_, i) => ({
        id: `client_${i}`,
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        created_by: 'user_123',
        assigned_to: 'user_123',
        is_deleted: false,
        created_at: new Date(Date.now() - i * 1000).toISOString(),
        updated_at: new Date(Date.now() - i * 1000).toISOString(),
      }));

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 15,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.listClients({ limit: 20 });

      // Less than limit returned, so no next_cursor
      expect(result.next_cursor).toBeUndefined();
    });
  });

  describe('Search', () => {
    it('should search by name', async () => {
      const mockClients = [
        {
          id: 'client_1',
          name: 'John Doe',
          email: 'john@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-13T10:00:00Z',
        },
      ];

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 1,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.listClients({ search: 'John' });

      expect(mockChain.or).toHaveBeenCalledWith('name.ilike.%John%,email.ilike.%John%');
      expect(result.data).toHaveLength(1);
    });

    it('should search by email', async () => {
      const mockClients = [
        {
          id: 'client_1',
          name: 'Jane Smith',
          email: 'jane@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-13T10:00:00Z',
        },
      ];

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 1,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      await service.listClients({ search: 'jane@' });

      expect(mockChain.or).toHaveBeenCalledWith('name.ilike.%jane@%,email.ilike.%jane@%');
    });

    it('should return matching results only', async () => {
      const mockClients = [
        {
          id: 'client_1',
          name: 'John Doe',
          email: 'john@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-13T10:00:00Z',
        },
        {
          id: 'client_2',
          name: 'Johnny Walker',
          email: 'johnny@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T09:00:00Z',
          updated_at: '2026-01-13T09:00:00Z',
        },
      ];

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 2,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.listClients({ search: 'John' });

      expect(result.data).toHaveLength(2);
      expect(result.total_count).toBe(2);
    });
  });

  describe('Filtering', () => {
    it('should filter by tag', async () => {
      const mockClients = [
        {
          id: 'client_1',
          name: 'John Doe',
          email: 'john@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-13T10:00:00Z',
          client_tags: [{ tag_name: 'VIP' }],
        },
      ];

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 1,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      await service.listClients({ tag: 'VIP' });

      expect(mockChain.contains).toHaveBeenCalledWith('client_tags', [{ tag_name: 'VIP' }]);
    });

    it('should always exclude soft-deleted clients', async () => {
      const mockClients = [
        {
          id: 'client_1',
          name: 'Active Client',
          email: 'active@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-13T10:00:00Z',
        },
      ];

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 1,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      await service.listClients({});

      // Verify is_deleted = false is always applied
      expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
    });
  });

  describe('Sorting', () => {
    it('should sort by created_at descending by default', async () => {
      const mockClients = [
        {
          id: 'client_1',
          name: 'Client 1',
          email: 'client1@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-13T10:00:00Z',
        },
      ];

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 1,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      await service.listClients({});

      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should support sorting by name', async () => {
      const mockClients = [
        {
          id: 'client_1',
          name: 'Alice',
          email: 'alice@example.com',
          created_by: 'user_123',
          assigned_to: 'user_123',
          is_deleted: false,
          created_at: '2026-01-13T10:00:00Z',
          updated_at: '2026-01-13T10:00:00Z',
        },
      ];

      const mockChain = createMockChain({
        data: mockClients,
        error: null,
        count: 1,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      await service.listClients({ sort: 'name' });

      expect(mockChain.order).toHaveBeenCalledWith('name', { ascending: false });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database query fails', async () => {
      const mockChain = createMockChain({
        data: null,
        error: {
          message: 'Database connection failed',
        },
        count: null,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      await expect(service.listClients({})).rejects.toThrow('Failed to list clients: Database connection failed');
    });

    it('should handle empty result set', async () => {
      const mockChain = createMockChain({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabaseFrom.mockReturnValue(mockChain);

      const result = await service.listClients({});

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
      expect(result.next_cursor).toBeUndefined();
    });
  });
});

describe('ClientService.getClientById', () => {
  let service: ClientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClientService();
  });

  it('should retrieve client by ID with related counts', async () => {
    const mockClient = {
      id: 'client_123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-123-4567',
      created_by: 'user_123',
      assigned_to: 'user_123',
      is_deleted: false,
      created_at: '2026-01-13T10:00:00Z',
      updated_at: '2026-01-13T10:00:00Z',
      documents: [{ count: 5 }],
      notes: [{ count: 3 }],
      tasks: [{ count: 2 }],
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockClient,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.getClientById('client_123');

    expect(mockSupabaseFrom).toHaveBeenCalledWith('clients');
    expect(mockChain.select).toHaveBeenCalledWith(expect.stringContaining('documents:client_documents(count)'));
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'client_123');
    expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
    expect(result).toMatchObject({
      id: 'client_123',
      name: 'John Doe',
      email: 'john@example.com',
      documents_count: 5,
      notes_count: 3,
      tasks_count: 2,
    });
  });

  it('should return null for non-existent ID', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116', // PostgREST "not found" error
          message: 'Row not found',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.getClientById('non_existent');

    expect(result).toBeNull();
  });

  it('should filter out soft-deleted clients', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row not found',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.getClientById('deleted_client');

    // Verify is_deleted filter was applied
    expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
    expect(result).toBeNull();
  });

  it('should handle clients with zero related items', async () => {
    const mockClient = {
      id: 'client_456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      created_by: 'user_123',
      assigned_to: 'user_123',
      is_deleted: false,
      created_at: '2026-01-13T10:00:00Z',
      updated_at: '2026-01-13T10:00:00Z',
      documents: [{ count: 0 }],
      notes: [{ count: 0 }],
      tasks: [{ count: 0 }],
    };

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockClient,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.getClientById('client_456');

    expect(result?.documents_count).toBe(0);
    expect(result?.notes_count).toBe(0);
    expect(result?.tasks_count).toBe(0);
  });

  it('should throw error for non-404 database errors', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42000',
          message: 'Database connection failed',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    await expect(service.getClientById('client_123')).rejects.toThrow('Database connection failed');
  });
});

describe('ClientService.updateClient', () => {
  let service: ClientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClientService();
  });

  it('should update client fields', async () => {
    const updateData = {
      name: 'John Updated',
      email: 'john.updated@example.com',
    };

    const updatedClient = {
      id: 'client_123',
      ...updateData,
      phone: '+1-555-123-4567',
      created_by: 'user_123',
      assigned_to: 'user_123',
      is_deleted: false,
      created_at: '2026-01-13T10:00:00Z',
      updated_at: '2026-01-13T12:00:00Z',
    };

    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updatedClient,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.updateClient('client_123', updateData);

    expect(mockSupabaseFrom).toHaveBeenCalledWith('clients');
    expect(mockChain.update).toHaveBeenCalledWith(updateData);
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'client_123');
    expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
    expect(result).toMatchObject({
      id: 'client_123',
      name: 'John Updated',
      email: 'john.updated@example.com',
    });
  });

  it('should return updated client', async () => {
    const updateData = {
      phone: '+1-555-999-8888',
    };

    const updatedClient = {
      id: 'client_456',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1-555-999-8888',
      created_by: 'user_123',
      assigned_to: 'user_123',
      is_deleted: false,
      created_at: '2026-01-13T10:00:00Z',
      updated_at: '2026-01-13T12:00:00Z',
    };

    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: updatedClient,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.updateClient('client_456', updateData);

    expect(result?.phone).toBe('+1-555-999-8888');
  });

  it('should return null for non-existent ID', async () => {
    const updateData = {
      name: 'Updated Name',
    };

    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row not found',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.updateClient('non_existent', updateData);

    expect(result).toBeNull();
  });

  it('should not update soft-deleted clients', async () => {
    const updateData = {
      name: 'Should Not Update',
    };

    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'Row not found',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.updateClient('deleted_client', updateData);

    // Verify is_deleted filter was applied
    expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
    expect(result).toBeNull();
  });

  it('should throw error for non-404 database errors', async () => {
    const updateData = {
      name: 'Updated Name',
    };

    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42000',
          message: 'Database connection failed',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    await expect(service.updateClient('client_123', updateData)).rejects.toThrow('Database connection failed');
  });
});

describe('ClientService.softDeleteClient', () => {
  let service: ClientService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClientService();
  });

  it('should set is_deleted = true (NOT hard delete)', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(function(this: any) {
        // Return this for chaining on first call, return promise on second
        if (this._eqCallCount === undefined) {
          this._eqCallCount = 0;
        }
        this._eqCallCount++;

        if (this._eqCallCount < 2) {
          return this;
        }
        return Promise.resolve({ data: null, error: null });
      }),
      _eqCallCount: 0,
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.softDeleteClient('client_123');

    expect(mockSupabaseFrom).toHaveBeenCalledWith('clients');
    expect(mockChain.update).toHaveBeenCalledWith({ is_deleted: true });
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'client_123');
    expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
    expect(result).toBe(true);
  });

  it('should return true on success', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(function(this: any) {
        if (this._eqCallCount === undefined) {
          this._eqCallCount = 0;
        }
        this._eqCallCount++;

        if (this._eqCallCount < 2) {
          return this;
        }
        return Promise.resolve({ data: null, error: null });
      }),
      _eqCallCount: 0,
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.softDeleteClient('client_456');

    expect(result).toBe(true);
  });

  it('should only soft delete clients that are not already deleted', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(function(this: any) {
        if (this._eqCallCount === undefined) {
          this._eqCallCount = 0;
        }
        this._eqCallCount++;

        if (this._eqCallCount < 2) {
          return this;
        }
        return Promise.resolve({ data: null, error: null });
      }),
      _eqCallCount: 0,
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    await service.softDeleteClient('client_789');

    // Verify is_deleted = false filter
    expect(mockChain.eq).toHaveBeenCalledWith('is_deleted', false);
  });

  it('should throw error for database failures', async () => {
    const mockChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn(function(this: any) {
        if (this._eqCallCount === undefined) {
          this._eqCallCount = 0;
        }
        this._eqCallCount++;

        if (this._eqCallCount < 2) {
          return this;
        }
        return Promise.resolve({
          data: null,
          error: {
            code: '42000',
            message: 'Database connection failed',
          },
        });
      }),
      _eqCallCount: 0,
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    await expect(service.softDeleteClient('client_123')).rejects.toThrow('Database connection failed');
  });
});
