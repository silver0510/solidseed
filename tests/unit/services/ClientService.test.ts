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
