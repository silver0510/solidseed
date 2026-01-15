/**
 * Unit Tests: NoteService
 *
 * TDD Tests for NoteService database operations:
 * - Note creation (add note to client)
 * - Note update (modify note content/importance)
 * - Note deletion (remove note from client)
 * - Get notes by client (list all notes)
 * - Error handling (not found, auth errors)
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
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();

  const mockSupabaseFrom = vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    single: mockSingle,
    update: mockUpdate,
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
    mockUpdate,
    mockDelete,
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Import after mock
import { NoteService } from '@/services/NoteService';
import type { CreateNoteInput, UpdateNoteInput } from '@/lib/types/client';

describe('NoteService Foundation', () => {
  it('should instantiate successfully', () => {
    const service = new NoteService();
    expect(service).toBeInstanceOf(NoteService);
  });

  it('should have Supabase client initialized', () => {
    const service = new NoteService();
    expect(service).toHaveProperty('supabase');
  });
});

describe('NoteService.addNote', () => {
  let service: NoteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NoteService();
  });

  it('should add a note to a client successfully', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const noteInput: CreateNoteInput = {
      content: 'Called client about property viewing',
      is_important: false,
    };

    const expectedNote = {
      id: 'note_abc123',
      client_id: 'client_123',
      content: 'Called client about property viewing',
      is_important: false,
      created_by: 'user_123',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedNote,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.addNote('client_123', noteInput);

    // Verify
    expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_notes');
    expect(result).toMatchObject({
      client_id: 'client_123',
      content: 'Called client about property viewing',
      created_by: 'user_123',
    });
    expect(result.id).toBeDefined();
  });

  it('should add an important note successfully', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const noteInput: CreateNoteInput = {
      content: 'URGENT: Client needs immediate callback',
      is_important: true,
    };

    const expectedNote = {
      id: 'note_xyz789',
      client_id: 'client_123',
      content: 'URGENT: Client needs immediate callback',
      is_important: true,
      created_by: 'user_123',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedNote,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.addNote('client_123', noteInput);

    // Verify
    expect(result.is_important).toBe(true);
  });

  it('should throw error when user is not authenticated', async () => {
    const mockNoUser = {
      data: {
        user: null,
      },
    };

    const noteInput: CreateNoteInput = {
      content: 'Test note',
    };

    // Setup mock
    mockSupabaseAuth.getUser.mockResolvedValue(mockNoUser);

    // Execute and verify
    await expect(service.addNote('client_123', noteInput)).rejects.toThrow('Not authenticated');
  });

  it('should handle database errors', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const noteInput: CreateNoteInput = {
      content: 'Test note',
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
    await expect(service.addNote('client_123', noteInput)).rejects.toThrow('Database connection failed');
  });
});

describe('NoteService.updateNote', () => {
  let service: NoteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NoteService();
  });

  it('should update note content successfully', async () => {
    const updateInput: UpdateNoteInput = {
      content: 'Updated note content',
    };

    const expectedNote = {
      id: 'note_123',
      client_id: 'client_123',
      content: 'Updated note content',
      is_important: false,
      created_by: 'user_123',
      created_at: '2026-01-15T09:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    const mockChain = {
      eq: vi.fn(function(this: any) {
        if (this._eqCallCount === undefined) {
          this._eqCallCount = 0;
        }
        this._eqCallCount++;

        if (this._eqCallCount < 2) {
          return this;
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: expectedNote,
            error: null,
          }),
        };
      }),
      _eqCallCount: 0,
    };

    mockSupabaseFrom.mockReturnValue({
      update: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.updateNote('client_123', 'note_123', updateInput);

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_notes');
    expect(result.content).toBe('Updated note content');
  });

  it('should update note importance flag', async () => {
    const updateInput: UpdateNoteInput = {
      is_important: true,
    };

    const expectedNote = {
      id: 'note_123',
      client_id: 'client_123',
      content: 'Original content',
      is_important: true,
      created_by: 'user_123',
      created_at: '2026-01-15T09:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    const mockChain = {
      eq: vi.fn(function(this: any) {
        if (this._eqCallCount === undefined) {
          this._eqCallCount = 0;
        }
        this._eqCallCount++;

        if (this._eqCallCount < 2) {
          return this;
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: expectedNote,
            error: null,
          }),
        };
      }),
      _eqCallCount: 0,
    };

    mockSupabaseFrom.mockReturnValue({
      update: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.updateNote('client_123', 'note_123', updateInput);

    // Verify
    expect(result.is_important).toBe(true);
  });

  it('should throw error when note not found', async () => {
    const updateInput: UpdateNoteInput = {
      content: 'Updated content',
    };

    const mockChain = {
      eq: vi.fn(function(this: any) {
        if (this._eqCallCount === undefined) {
          this._eqCallCount = 0;
        }
        this._eqCallCount++;

        if (this._eqCallCount < 2) {
          return this;
        }
        return {
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST116',
              message: 'The result contains 0 rows',
            },
          }),
        };
      }),
      _eqCallCount: 0,
    };

    mockSupabaseFrom.mockReturnValue({
      update: vi.fn().mockReturnValue(mockChain),
    });

    // Execute and verify
    await expect(service.updateNote('client_123', 'note_999', updateInput)).rejects.toThrow();
  });
});

describe('NoteService.deleteNote', () => {
  let service: NoteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NoteService();
  });

  it('should delete a note successfully', async () => {
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
    const result = await service.deleteNote('client_123', 'note_456');

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_notes');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'note_456');
    expect(mockChain.eq).toHaveBeenCalledWith('client_id', 'client_123');
    expect(result).toBe(true);
  });

  it('should handle database errors on delete', async () => {
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

    await expect(service.deleteNote('client_123', 'note_456')).rejects.toThrow('Database connection failed');
  });
});

describe('NoteService.getNotesByClient', () => {
  let service: NoteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new NoteService();
  });

  it('should return all notes for a client', async () => {
    const mockNotes = [
      {
        id: 'note_1',
        client_id: 'client_123',
        content: 'First note',
        is_important: false,
        created_by: 'user_123',
        created_at: '2026-01-15T09:00:00Z',
        updated_at: '2026-01-15T09:00:00Z',
      },
      {
        id: 'note_2',
        client_id: 'client_123',
        content: 'Second note',
        is_important: true,
        created_by: 'user_123',
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-15T10:00:00Z',
      },
    ];

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockNotes,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    const result = await service.getNotesByClient('client_123');

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_notes');
    expect(mockChain.eq).toHaveBeenCalledWith('client_id', 'client_123');
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('First note');
    expect(result[1].is_important).toBe(true);
  });

  it('should return empty array when no notes exist', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    const result = await service.getNotesByClient('client_456');

    // Verify
    expect(result).toEqual([]);
  });

  it('should handle database errors', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: '42000',
          message: 'Database connection failed',
        },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    await expect(service.getNotesByClient('client_123')).rejects.toThrow('Failed to get notes');
  });

  it('should order notes by created_at descending', async () => {
    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    await service.getNotesByClient('client_123');

    // Verify order was called with descending
    expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});
