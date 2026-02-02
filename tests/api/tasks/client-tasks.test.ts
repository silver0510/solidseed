/**
 * Unit Tests for /api/clients/:id/tasks
 *
 * Tests the client task endpoints:
 * - GET: Get all tasks for a specific client
 * - POST: Create a new task for a client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TEST_IDS } from '../../helpers/fixtures';
import {
  createMockSessionUser,
  createUnauthenticatedSession,
  createMockTasks,
  createMockTask,
  createMockTaskService,
  createMockActivityLog,
  TEST_SCENARIOS,
} from './mocks';

// =============================================================================
// MOCKS (using vi.hoisted to handle mock hoisting)
// =============================================================================

const { mockGetSessionUser, mockTaskService, mockLogActivityAsync } = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
  mockTaskService: {
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getTasksByClient: vi.fn(),
    getTasksByAgent: vi.fn(),
  },
  mockLogActivityAsync: vi.fn(),
}));

// Mock the session utility
vi.mock('@/lib/auth/session', () => ({
  getSessionUser: () => mockGetSessionUser(),
}));

// Mock the TaskService
vi.mock('@/services/TaskService', () => ({
  TaskService: class MockTaskService {
    addTask = mockTaskService.addTask;
    updateTask = mockTaskService.updateTask;
    deleteTask = mockTaskService.deleteTask;
    getTasksByClient = mockTaskService.getTasksByClient;
    getTasksByAgent = mockTaskService.getTasksByAgent;
  },
}));

// Mock the ActivityLogService
vi.mock('@/services/ActivityLogService', () => ({
  logActivityAsync: (...args: unknown[]) => mockLogActivityAsync(...args),
}));

// Import the route handlers after mocks are set up
import { GET, POST } from '@/app/api/clients/[id]/tasks/route';

// =============================================================================
// HELPER: Create mock params
// =============================================================================

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// =============================================================================
// GET /api/clients/:id/tasks TESTS
// =============================================================================

describe('GET /api/clients/:id/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Authentication Tests
  // ---------------------------------------------------------------------------

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSessionUser.mockResolvedValue(createUnauthenticatedSession());

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`
      );
      const response = await GET(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });
  });

  // ---------------------------------------------------------------------------
  // Validation Tests
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return 400 when client ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/clients//tasks'
      );
      const response = await GET(request, createParams(''));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Client ID is required');
    });
  });

  // ---------------------------------------------------------------------------
  // Success Cases
  // ---------------------------------------------------------------------------

  describe('Success Cases', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return all tasks for the client', async () => {
      const mockTasks = createMockTasks(3, { client_id: TEST_IDS.CLIENT_1 });
      mockTaskService.getTasksByClient.mockResolvedValue(mockTasks);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`
      );
      const response = await GET(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      expect(mockTaskService.getTasksByClient).toHaveBeenCalledWith(
        TEST_IDS.CLIENT_1,
        TEST_IDS.USER_1
      );
    });

    it('should return empty array when client has no tasks', async () => {
      mockTaskService.getTasksByClient.mockResolvedValue([]);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`
      );
      const response = await GET(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return 500 when TaskService throws an error', async () => {
      mockTaskService.getTasksByClient.mockRejectedValue(
        new Error('Client not found or access denied')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`
      );
      const response = await GET(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Client not found or access denied');
    });
  });
});

// =============================================================================
// POST /api/clients/:id/tasks TESTS
// =============================================================================

describe('POST /api/clients/:id/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Authentication Tests
  // ---------------------------------------------------------------------------

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSessionUser.mockResolvedValue(createUnauthenticatedSession());

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(TEST_SCENARIOS.validCreateInput),
        }
      );
      const response = await POST(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });
  });

  // ---------------------------------------------------------------------------
  // Validation Tests
  // ---------------------------------------------------------------------------

  describe('Validation', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return 400 when client ID is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/clients//tasks',
        {
          method: 'POST',
          body: JSON.stringify(TEST_SCENARIOS.validCreateInput),
        }
      );
      const response = await POST(request, createParams(''));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Client ID is required');
    });

    it('should return 400 when title is missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify({ description: 'No title' }),
        }
      );
      const response = await POST(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('should return 400 when due_date is missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify({ title: 'Task without due date' }),
        }
      );
      const response = await POST(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid priority value', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Task',
            due_date: '2026-01-15',
            priority: 'invalid',
          }),
        }
      );
      const response = await POST(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  // ---------------------------------------------------------------------------
  // Success Cases
  // ---------------------------------------------------------------------------

  describe('Success Cases', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should create a task with valid input', async () => {
      const newTask = createMockTask({
        ...TEST_SCENARIOS.validCreateInput,
        client_id: TEST_IDS.CLIENT_1,
      });
      mockTaskService.addTask.mockResolvedValue(newTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(TEST_SCENARIOS.validCreateInput),
        }
      );
      const response = await POST(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(TEST_SCENARIOS.validCreateInput.title);
      expect(mockTaskService.addTask).toHaveBeenCalledWith(
        TEST_IDS.CLIENT_1,
        expect.objectContaining({
          title: TEST_SCENARIOS.validCreateInput.title,
          due_date: TEST_SCENARIOS.validCreateInput.due_date,
        }),
        TEST_IDS.USER_1
      );
    });

    it('should create a task with minimum required fields', async () => {
      const minimalInput = {
        title: 'Minimal Task',
        due_date: '2026-01-15',
      };
      const newTask = createMockTask({
        ...minimalInput,
        client_id: TEST_IDS.CLIENT_1,
      });
      mockTaskService.addTask.mockResolvedValue(newTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(minimalInput),
        }
      );
      const response = await POST(request, createParams(TEST_IDS.CLIENT_1));

      expect(response.status).toBe(201);
    });

    it('should log activity when task is created', async () => {
      const newTask = createMockTask({
        ...TEST_SCENARIOS.validCreateInput,
        client_id: TEST_IDS.CLIENT_1,
        id: TEST_IDS.TASK_1,
      });
      mockTaskService.addTask.mockResolvedValue(newTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(TEST_SCENARIOS.validCreateInput),
        }
      );
      await POST(request, createParams(TEST_IDS.CLIENT_1));

      expect(mockLogActivityAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          activity_type: 'task.created',
          entity_type: 'task',
          entity_id: TEST_IDS.TASK_1,
          client_id: TEST_IDS.CLIENT_1,
          metadata: expect.objectContaining({
            task_title: TEST_SCENARIOS.validCreateInput.title,
          }),
        }),
        TEST_IDS.USER_1
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return 500 when TaskService throws an error', async () => {
      mockTaskService.addTask.mockRejectedValue(
        new Error('Client not found or access denied')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(TEST_SCENARIOS.validCreateInput),
        }
      );
      const response = await POST(request, createParams(TEST_IDS.CLIENT_1));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Client not found or access denied');
    });
  });
});
