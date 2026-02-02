/**
 * Unit Tests for /api/clients/:id/tasks/:taskId
 *
 * Tests the individual task operation endpoints:
 * - PATCH: Update a task
 * - DELETE: Delete a task
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TEST_IDS } from '../../helpers/fixtures';
import {
  createMockSessionUser,
  createUnauthenticatedSession,
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
import { PATCH, DELETE } from '@/app/api/clients/[id]/tasks/[taskId]/route';

// =============================================================================
// HELPER: Create mock params
// =============================================================================

function createParams(id: string, taskId: string) {
  return { params: Promise.resolve({ id, taskId }) };
}

// =============================================================================
// PATCH /api/clients/:id/tasks/:taskId TESTS
// =============================================================================

describe('PATCH /api/clients/:id/tasks/:taskId', () => {
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
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify(TEST_SCENARIOS.validUpdateInput),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
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
        `http://localhost:3000/api/clients//tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify(TEST_SCENARIOS.validUpdateInput),
        }
      );
      const response = await PATCH(request, createParams('', TEST_IDS.TASK_1));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Client ID is required');
    });

    it('should return 400 when task ID is missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/`,
        {
          method: 'PATCH',
          body: JSON.stringify(TEST_SCENARIOS.validUpdateInput),
        }
      );
      const response = await PATCH(request, createParams(TEST_IDS.CLIENT_1, ''));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Task ID is required');
    });

    it('should return 400 for invalid status value', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'invalid_status' }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 for invalid priority value', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ priority: 'invalid_priority' }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
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

    it('should update task title', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        title: 'Updated Title',
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated Title' }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
      expect(mockTaskService.updateTask).toHaveBeenCalledWith(
        TEST_IDS.CLIENT_1,
        TEST_IDS.TASK_1,
        expect.objectContaining({ title: 'Updated Title' }),
        TEST_IDS.USER_1
      );
    });

    it('should update task status', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        status: 'in_progress',
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('in_progress');
    });

    it('should update task priority', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        priority: 'high',
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ priority: 'high' }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.priority).toBe('high');
    });

    it('should update task due_date', async () => {
      const newDueDate = '2026-02-15';
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        due_date: newDueDate,
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ due_date: newDueDate }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.due_date).toBe(newDueDate);
    });

    it('should update multiple fields at once', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        title: 'New Title',
        status: 'in_progress',
        priority: 'high',
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            title: 'New Title',
            status: 'in_progress',
            priority: 'high',
          }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('New Title');
      expect(data.status).toBe('in_progress');
      expect(data.priority).toBe('high');
    });

    it('should move task to different client', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_2,
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ client_id: TEST_IDS.CLIENT_2 }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.client_id).toBe(TEST_IDS.CLIENT_2);
    });
  });

  // ---------------------------------------------------------------------------
  // Activity Logging Tests
  // ---------------------------------------------------------------------------

  describe('Activity Logging', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should log activity when task is closed', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        title: 'Completed Task',
        status: 'closed',
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'closed' }),
        }
      );
      await PATCH(request, createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1));

      expect(mockLogActivityAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          activity_type: 'task.completed',
          entity_type: 'task',
          entity_id: TEST_IDS.TASK_1,
          client_id: TEST_IDS.CLIENT_1,
          metadata: expect.objectContaining({
            task_title: 'Completed Task',
          }),
        }),
        TEST_IDS.USER_1
      );
    });

    it('should not log activity for non-close status changes', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        status: 'in_progress',
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'in_progress' }),
        }
      );
      await PATCH(request, createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1));

      expect(mockLogActivityAsync).not.toHaveBeenCalled();
    });

    it('should not log activity for non-status updates', async () => {
      const updatedTask = createMockTask({
        id: TEST_IDS.TASK_1,
        client_id: TEST_IDS.CLIENT_1,
        title: 'Updated Title',
      });
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated Title' }),
        }
      );
      await PATCH(request, createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1));

      expect(mockLogActivityAsync).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Error Handling Tests
  // ---------------------------------------------------------------------------

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return 404 when task is not found', async () => {
      mockTaskService.updateTask.mockRejectedValue(
        new Error('Expected 1 row but got 0 rows')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated' }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found');
    });

    it('should return 500 for other errors', async () => {
      mockTaskService.updateTask.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated' }),
        }
      );
      const response = await PATCH(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });
  });
});

// =============================================================================
// DELETE /api/clients/:id/tasks/:taskId TESTS
// =============================================================================

describe('DELETE /api/clients/:id/tasks/:taskId', () => {
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
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        { method: 'DELETE' }
      );
      const response = await DELETE(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
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
        `http://localhost:3000/api/clients//tasks/${TEST_IDS.TASK_1}`,
        { method: 'DELETE' }
      );
      const response = await DELETE(request, createParams('', TEST_IDS.TASK_1));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Client ID is required');
    });

    it('should return 400 when task ID is missing', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/`,
        { method: 'DELETE' }
      );
      const response = await DELETE(request, createParams(TEST_IDS.CLIENT_1, ''));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Task ID is required');
    });
  });

  // ---------------------------------------------------------------------------
  // Success Cases
  // ---------------------------------------------------------------------------

  describe('Success Cases', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should delete task successfully', async () => {
      mockTaskService.deleteTask.mockResolvedValue(true);

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        { method: 'DELETE' }
      );
      const response = await DELETE(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );

      expect(response.status).toBe(204);
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith(
        TEST_IDS.CLIENT_1,
        TEST_IDS.TASK_1,
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
      mockTaskService.deleteTask.mockRejectedValue(
        new Error('Client not found or access denied')
      );

      const request = new NextRequest(
        `http://localhost:3000/api/clients/${TEST_IDS.CLIENT_1}/tasks/${TEST_IDS.TASK_1}`,
        { method: 'DELETE' }
      );
      const response = await DELETE(
        request,
        createParams(TEST_IDS.CLIENT_1, TEST_IDS.TASK_1)
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Client not found or access denied');
    });
  });
});
