/**
 * Mock utilities for Task API tests
 *
 * Provides mock implementations for TaskService, session validation,
 * and test data factories for task-related testing.
 */

import { vi } from 'vitest';
import { TEST_IDS } from '../../helpers/fixtures';
import type { ClientTask, TaskWithClient, TaskStatus, TaskPriority } from '@/lib/types/client';

// =============================================================================
// MOCK SESSION USER
// =============================================================================

/**
 * Creates a mock session user response
 */
export function createMockSessionUser(overrides: {
  id?: string;
  email?: string;
  name?: string;
} = {}) {
  return {
    user: {
      id: overrides.id ?? TEST_IDS.USER_1,
      email: overrides.email ?? 'test@example.com',
      name: overrides.name ?? 'Test User',
    },
    error: null,
  };
}

/**
 * Creates an unauthenticated session response
 */
export function createUnauthenticatedSession(errorMessage = 'Not authenticated') {
  return {
    user: null,
    error: errorMessage,
  };
}

// =============================================================================
// MOCK TASK DATA FACTORIES
// =============================================================================

/**
 * Creates a mock ClientTask
 */
export function createMockTask(overrides: Partial<ClientTask> = {}): ClientTask {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    id: overrides.id ?? TEST_IDS.TASK_1,
    client_id: overrides.client_id ?? TEST_IDS.CLIENT_1,
    title: overrides.title ?? 'Test Task',
    description: overrides.description ?? 'Test task description',
    due_date: overrides.due_date ?? tomorrow!,
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'todo',
    completed_at: overrides.completed_at ?? null,
    created_by: overrides.created_by ?? TEST_IDS.USER_1,
    assigned_to: overrides.assigned_to ?? TEST_IDS.USER_1,
    created_at: overrides.created_at ?? now,
    updated_at: overrides.updated_at ?? now,
  };
}

/**
 * Creates a mock TaskWithClient (includes client_name)
 */
export function createMockTaskWithClient(overrides: Partial<TaskWithClient> = {}): TaskWithClient {
  return {
    ...createMockTask(overrides),
    client_name: overrides.client_name ?? 'Test Client',
  };
}

/**
 * Creates multiple mock tasks
 */
export function createMockTasks(count: number, overrides: Partial<ClientTask> = {}): ClientTask[] {
  return Array.from({ length: count }, (_, i) => createMockTask({
    ...overrides,
    id: `task-${i + 1}`,
    title: `Task ${i + 1}`,
  }));
}

/**
 * Creates multiple mock tasks with client info
 */
export function createMockTasksWithClient(count: number, overrides: Partial<TaskWithClient> = {}): TaskWithClient[] {
  return Array.from({ length: count }, (_, i) => createMockTaskWithClient({
    ...overrides,
    id: `task-${i + 1}`,
    title: `Task ${i + 1}`,
  }));
}

// =============================================================================
// MOCK TASK SERVICE
// =============================================================================

/**
 * Creates a mock TaskService with all methods
 */
export function createMockTaskService() {
  return {
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getTasksByClient: vi.fn(),
    getTasksByAgent: vi.fn(),
  };
}

// =============================================================================
// MOCK NEXT.JS REQUEST/RESPONSE
// =============================================================================

/**
 * Creates a mock NextRequest
 */
export function createMockNextRequest(options: {
  method?: string;
  url?: string;
  body?: Record<string, unknown>;
  searchParams?: Record<string, string>;
} = {}) {
  const url = new URL(options.url ?? 'http://localhost:3000/api/test');

  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    method: options.method ?? 'GET',
    url: url.toString(),
    nextUrl: url,
    json: vi.fn().mockResolvedValue(options.body ?? {}),
    headers: new Headers(),
  } as unknown as Request & { nextUrl: URL };
}

/**
 * Creates mock route params
 */
export function createMockRouteParams(params: Record<string, string>) {
  return {
    params: Promise.resolve(params),
  };
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

/**
 * Common test data scenarios
 */
export const TEST_SCENARIOS = {
  /** Valid task creation input */
  validCreateInput: {
    title: 'New Task',
    description: 'Task description',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high' as TaskPriority,
  },

  /** Valid task update input */
  validUpdateInput: {
    title: 'Updated Task',
    status: 'in_progress' as TaskStatus,
  },

  /** Status-only update input */
  statusOnlyUpdate: {
    status: 'closed' as TaskStatus,
  },

  /** Invalid input - missing required field */
  invalidInput: {
    description: 'No title provided',
  },

  /** Invalid status value */
  invalidStatus: {
    status: 'invalid_status',
  },

  /** Invalid priority value */
  invalidPriority: {
    title: 'Task',
    due_date: '2026-01-15',
    priority: 'invalid_priority',
  },
};

// =============================================================================
// MOCK ACTIVITY LOG SERVICE
// =============================================================================

/**
 * Creates a mock for logActivityAsync
 */
export function createMockActivityLog() {
  return vi.fn();
}
