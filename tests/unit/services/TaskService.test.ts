/**
 * Unit Tests: TaskService
 *
 * TDD Tests for TaskService database operations:
 * - Task creation (add task to client)
 * - Task update (modify task details/status)
 * - Task deletion (remove task from client)
 * - Get tasks by client (list all tasks)
 * - Get tasks by agent (for dashboard)
 * - Task filtering (by status, priority, due date)
 * - Task completion
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
import { TaskService } from '@/services/TaskService';
import type { CreateTaskInput, UpdateTaskInput, TaskFilters } from '@/lib/types/client';

describe('TaskService Foundation', () => {
  it('should instantiate successfully', () => {
    const service = new TaskService();
    expect(service).toBeInstanceOf(TaskService);
  });

  it('should have Supabase client initialized', () => {
    const service = new TaskService();
    expect(service).toHaveProperty('supabase');
  });
});

describe('TaskService.addTask', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService();
  });

  it('should add a task to a client successfully', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const taskInput: CreateTaskInput = {
      title: 'Schedule property viewing',
      description: 'Coordinate viewing with seller',
      due_date: '2026-01-20',
      priority: 'high',
    };

    const expectedTask = {
      id: 'task_abc123',
      client_id: 'client_123',
      title: 'Schedule property viewing',
      description: 'Coordinate viewing with seller',
      due_date: '2026-01-20',
      priority: 'high',
      status: 'pending',
      completed_at: null,
      created_by: 'user_123',
      assigned_to: 'user_123',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedTask,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.addTask('client_123', taskInput);

    // Verify
    expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tasks');
    expect(result).toMatchObject({
      client_id: 'client_123',
      title: 'Schedule property viewing',
      priority: 'high',
      status: 'pending',
    });
    expect(result.id).toBeDefined();
  });

  it('should default priority to medium when not provided', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const taskInput: CreateTaskInput = {
      title: 'Follow up call',
      due_date: '2026-01-18',
    };

    const expectedTask = {
      id: 'task_xyz789',
      client_id: 'client_123',
      title: 'Follow up call',
      due_date: '2026-01-18',
      priority: 'medium',
      status: 'pending',
      completed_at: null,
      created_by: 'user_123',
      assigned_to: 'user_123',
      created_at: '2026-01-15T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedTask,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockChain),
    });

    // Execute
    const result = await service.addTask('client_123', taskInput);

    // Verify
    expect(result.priority).toBe('medium');
  });

  it('should throw error when user is not authenticated', async () => {
    const mockNoUser = {
      data: {
        user: null,
      },
    };

    const taskInput: CreateTaskInput = {
      title: 'Test task',
      due_date: '2026-01-20',
    };

    // Setup mock
    mockSupabaseAuth.getUser.mockResolvedValue(mockNoUser);

    // Execute and verify
    await expect(service.addTask('client_123', taskInput)).rejects.toThrow('Not authenticated');
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

    const taskInput: CreateTaskInput = {
      title: 'Test task',
      due_date: '2026-01-20',
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
    await expect(service.addTask('client_123', taskInput)).rejects.toThrow('Database connection failed');
  });
});

describe('TaskService.updateTask', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService();
  });

  it('should update task details successfully', async () => {
    const updateInput: UpdateTaskInput = {
      title: 'Updated task title',
      priority: 'low',
    };

    const expectedTask = {
      id: 'task_123',
      client_id: 'client_123',
      title: 'Updated task title',
      priority: 'low',
      status: 'pending',
      due_date: '2026-01-20',
      created_by: 'user_123',
      assigned_to: 'user_123',
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
            data: expectedTask,
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
    const result = await service.updateTask('client_123', 'task_123', updateInput);

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tasks');
    expect(result.title).toBe('Updated task title');
    expect(result.priority).toBe('low');
  });

  it('should complete a task and set completed_at', async () => {
    const updateInput: UpdateTaskInput = {
      status: 'completed',
    };

    const expectedTask = {
      id: 'task_123',
      client_id: 'client_123',
      title: 'Task title',
      priority: 'medium',
      status: 'completed',
      completed_at: '2026-01-15T10:00:00Z',
      due_date: '2026-01-20',
      created_by: 'user_123',
      assigned_to: 'user_123',
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
            data: expectedTask,
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
    const result = await service.updateTask('client_123', 'task_123', updateInput);

    // Verify
    expect(result.status).toBe('completed');
    expect(result.completed_at).toBeDefined();
  });

  it('should throw error when task not found', async () => {
    const updateInput: UpdateTaskInput = {
      title: 'Updated title',
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
    await expect(service.updateTask('client_123', 'task_999', updateInput)).rejects.toThrow();
  });
});

describe('TaskService.deleteTask', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService();
  });

  it('should delete a task successfully', async () => {
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
    const result = await service.deleteTask('client_123', 'task_456');

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tasks');
    expect(mockChain.eq).toHaveBeenCalledWith('id', 'task_456');
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

    await expect(service.deleteTask('client_123', 'task_456')).rejects.toThrow('Database connection failed');
  });
});

describe('TaskService.getTasksByClient', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService();
  });

  it('should return all tasks for a client', async () => {
    const mockTasks = [
      {
        id: 'task_1',
        client_id: 'client_123',
        title: 'First task',
        priority: 'high',
        status: 'pending',
        due_date: '2026-01-18',
        created_by: 'user_123',
        assigned_to: 'user_123',
        created_at: '2026-01-15T09:00:00Z',
        updated_at: '2026-01-15T09:00:00Z',
      },
      {
        id: 'task_2',
        client_id: 'client_123',
        title: 'Second task',
        priority: 'low',
        status: 'completed',
        completed_at: '2026-01-14T15:00:00Z',
        due_date: '2026-01-14',
        created_by: 'user_123',
        assigned_to: 'user_123',
        created_at: '2026-01-13T10:00:00Z',
        updated_at: '2026-01-14T15:00:00Z',
      },
    ];

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockTasks,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    const result = await service.getTasksByClient('client_123');

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tasks');
    expect(mockChain.eq).toHaveBeenCalledWith('client_id', 'client_123');
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('First task');
    expect(result[1].status).toBe('completed');
  });

  it('should return empty array when no tasks exist', async () => {
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
    const result = await service.getTasksByClient('client_456');

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

    await expect(service.getTasksByClient('client_123')).rejects.toThrow('Failed to get tasks');
  });
});

describe('TaskService.getTasksByAgent', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService();
  });

  it('should return all tasks assigned to the current agent', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const mockTasks = [
      {
        id: 'task_1',
        client_id: 'client_123',
        title: 'Task for client A',
        priority: 'high',
        status: 'pending',
        due_date: '2026-01-18',
        created_by: 'user_123',
        assigned_to: 'user_123',
        clients: { first_name: 'John', last_name: 'Doe' },
      },
      {
        id: 'task_2',
        client_id: 'client_456',
        title: 'Task for client B',
        priority: 'medium',
        status: 'pending',
        due_date: '2026-01-20',
        created_by: 'user_123',
        assigned_to: 'user_123',
        clients: { first_name: 'Jane', last_name: 'Smith' },
      },
    ];

    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockTasks,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    const result = await service.getTasksByAgent();

    // Verify
    expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_tasks');
    expect(mockChain.eq).toHaveBeenCalledWith('assigned_to', 'user_123');
    expect(result).toHaveLength(2);
  });

  it('should filter tasks by status', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const mockTasks = [
      {
        id: 'task_1',
        status: 'pending',
        clients: { first_name: 'John', last_name: 'Doe' },
      },
    ];

    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockTasks,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const filters: TaskFilters = { status: 'pending' };

    // Execute
    await service.getTasksByAgent(filters);

    // Verify eq was called for both assigned_to and status
    expect(mockChain.eq).toHaveBeenCalledWith('assigned_to', 'user_123');
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
  });

  it('should throw error when not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
    });

    await expect(service.getTasksByAgent()).rejects.toThrow('Not authenticated');
  });

  it('should filter tasks by priority', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const filters: TaskFilters = { priority: 'high' };

    // Execute
    await service.getTasksByAgent(filters);

    // Verify eq was called for both assigned_to and priority
    expect(mockChain.eq).toHaveBeenCalledWith('assigned_to', 'user_123');
    expect(mockChain.eq).toHaveBeenCalledWith('priority', 'high');
  });

  it('should filter tasks by due_before date', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const filters: TaskFilters = { due_before: '2026-01-20' };

    // Execute
    await service.getTasksByAgent(filters);

    // Verify lte was called for due_before
    expect(mockChain.lte).toHaveBeenCalledWith('due_date', '2026-01-20');
  });

  it('should filter tasks by due_after date', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const filters: TaskFilters = { due_after: '2026-01-15' };

    // Execute
    await service.getTasksByAgent(filters);

    // Verify gte was called for due_after
    expect(mockChain.gte).toHaveBeenCalledWith('due_date', '2026-01-15');
  });

  it('should apply combined filters', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    const filters: TaskFilters = {
      status: 'pending',
      priority: 'high',
      due_before: '2026-01-25',
      due_after: '2026-01-15',
    };

    // Execute
    await service.getTasksByAgent(filters);

    // Verify all filters were applied
    expect(mockChain.eq).toHaveBeenCalledWith('assigned_to', 'user_123');
    expect(mockChain.eq).toHaveBeenCalledWith('status', 'pending');
    expect(mockChain.eq).toHaveBeenCalledWith('priority', 'high');
    expect(mockChain.lte).toHaveBeenCalledWith('due_date', '2026-01-25');
    expect(mockChain.gte).toHaveBeenCalledWith('due_date', '2026-01-15');
  });

  it('should include client name in response', async () => {
    const mockUser = {
      data: {
        user: {
          id: 'user_123',
          email: 'agent@example.com',
        },
      },
    };

    const mockTasks = [
      {
        id: 'task_1',
        client_id: 'client_123',
        title: 'Task with client info',
        clients: { first_name: 'John', last_name: 'Doe' },
      },
    ];

    mockSupabaseAuth.getUser.mockResolvedValue(mockUser);

    const mockChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockTasks,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockChain);

    // Execute
    const result = await service.getTasksByAgent();

    // Verify client_name is included
    expect(result[0].client_name).toBe('John Doe');
  });
});
