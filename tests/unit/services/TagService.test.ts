/**
 * Unit Tests: TagService
 *
 * TDD Tests for TagService database operations:
 * - Tag creation (add tag to client)
 * - Tag deletion (remove tag from client)
 * - Tag autocomplete (get existing tags)
 * - Error handling (duplicates, not found)
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
  const mockDelete = vi.fn();

  const mockSupabaseFrom = vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    single: mockSingle,
    delete: mockDelete,
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
    mockDelete,
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Import after mock
import { TagService } from '@/services/TagService';
import type { CreateTagInput } from '@/lib/types/client';

describe('TagService Foundation', () => {
  it('should instantiate successfully', () => {
    const service = new TagService();
    expect(service).toBeInstanceOf(TagService);
  });

  it('should have Supabase client initialized', () => {
    const service = new TagService();
    expect(service).toHaveProperty('supabase');
  });
});

describe('TagService.addTag', () => {
  let service: TagService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TagService();
  });

  it('should add a tag to a client successfully', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const tagInput: CreateTagInput = {
      tag_name: 'VIP',
    };

    const expectedTag = {
      id: expect.stringMatching(/^[a-z0-9]+$/),
      client_id: 'client_123',
      tag_name: 'VIP',
      created_by: 'user_123',
      created_at: '2026-01-15T10:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedTag,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.addTag('client_123', tagInput);

    // Verify
    expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tags');
    expect(result).toMatchObject({
      client_id: 'client_123',
      tag_name: 'VIP',
      created_by: 'user_123',
    });
    expect(result.id).toBeDefined();
  });

  it('should throw error when user is not authenticated', async () => {
    const mockNoUser = {
      data: {
        user: null,
      },
    };

    const tagInput: CreateTagInput = {
      tag_name: 'Hot Lead',
    };

    // Setup mock
    mockSupabaseAuth.getUser.mockResolvedValue(mockNoUser);

    // Execute and verify
    await expect(service.addTag('client_123', tagInput)).rejects.toThrow('Not authenticated');
  });

  it('should throw error when tag already exists on client (duplicate)', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const tagInput: CreateTagInput = {
      tag_name: 'VIP',
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
    await expect(service.addTag('client_123', tagInput)).rejects.toThrow('Tag already exists on this client');
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

    const tagInput: CreateTagInput = {
      tag_name: 'New Tag',
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
    await expect(service.addTag('client_123', tagInput)).rejects.toThrow('Database connection failed');
  });

  it('should set created_by from authenticated user', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_456',
          email: 'agent@example.com',
        },
      },
    };

    const tagInput: CreateTagInput = {
      tag_name: 'Buyer',
    };

    const expectedTag = {
      id: 'tag_xyz789',
      client_id: 'client_123',
      tag_name: 'Buyer',
      created_by: 'user_456',
      created_at: '2026-01-15T10:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedTag,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.addTag('client_123', tagInput);

    // Verify user field is set
    expect(result.created_by).toBe('user_456');
  });
});

describe('TagService.removeTag', () => {
  let service: TagService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TagService();
  });

  it('should remove a tag successfully', async () => {
    const mockChain = {
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

    mockSupabaseFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.removeTag('client_123', 'tag_456');

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tags');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'tag_456');
    expect(mockChain.eq).toHaveBeenCalledWith('client_id', 'client_123');
    expect(result).toBe(true);
  });

  it('should return true on successful deletion', async () => {
    const mockChain = {
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

    mockSupabaseFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockChain),
    });

    const result = await service.removeTag('client_789', 'tag_abc');

    expect(result).toBe(true);
  });

  it('should throw error for database failures', async () => {
    const mockChain = {
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

    mockSupabaseFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockChain),
    });

    await expect(service.removeTag('client_123', 'tag_456')).rejects.toThrow('Database connection failed');
  });
});

describe('TagService.getTagAutocomplete', () => {
  let service: TagService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TagService();
  });

  it('should return unique tag names for autocomplete', async () => {
    const mockTags = [
      { tag_name: 'VIP' },
      { tag_name: 'Hot Lead' },
      { tag_name: 'Buyer' },
      { tag_name: 'Seller' },
    ];

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockTags,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    const result = await service.getTagAutocomplete('');

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tags');
    expect(result).toEqual(['VIP', 'Hot Lead', 'Buyer', 'Seller']);
  });

  it('should filter tags by search query', async () => {
    const mockTags = [
      { tag_name: 'VIP' },
    ];

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockTags,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    const result = await service.getTagAutocomplete('VIP');

    // Verify ilike was called with search pattern
    expect(mockChain.ilike).toHaveBeenCalledWith('tag_name', '%VIP%');
    expect(result).toEqual(['VIP']);
  });

  it('should return empty array when no tags found', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const result = await service.getTagAutocomplete('nonexistent');

    expect(result).toEqual([]);
  });

  it('should limit results to 10 tags', async () => {
    const mockTags = Array.from({ length: 10 }, (_, i) => ({
      tag_name: `Tag ${i}`,
    }));

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockTags,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    await service.getTagAutocomplete('');

    expect(mockChain.limit).toHaveBeenCalledWith(10);
  });

  it('should handle database errors gracefully', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42000',
          message: 'Database connection failed',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    await expect(service.getTagAutocomplete('')).rejects.toThrow('Failed to get tags');
  });
});
