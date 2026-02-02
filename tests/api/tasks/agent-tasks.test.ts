/**
 * Unit Tests for GET /api/agent/tasks
 *
 * Tests the agent task dashboard endpoint that returns all tasks
 * assigned to the authenticated user with optional filtering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TEST_IDS } from '../../helpers/fixtures';
import {
  createMockSessionUser,
  createUnauthenticatedSession,
  createMockTasksWithClient,
  createMockTaskService,
} from './mocks';

// =============================================================================
// MOCKS (using vi.hoisted to handle mock hoisting)
// =============================================================================

const { mockGetSessionUser, mockTaskService } = vi.hoisted(() => ({
  mockGetSessionUser: vi.fn(),
  mockTaskService: {
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getTasksByClient: vi.fn(),
    getTasksByAgent: vi.fn(),
  },
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

// Import the route handler after mocks are set up
import { GET } from '@/app/api/agent/tasks/route';

// =============================================================================
// TESTS
// =============================================================================

describe('GET /api/agent/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Authentication Tests
  // ---------------------------------------------------------------------------

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSessionUser.mockResolvedValue(createUnauthenticatedSession());

      const request = new NextRequest('http://localhost:3000/api/agent/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 401 with custom error message from session', async () => {
      mockGetSessionUser.mockResolvedValue(
        createUnauthenticatedSession('Session expired')
      );

      const request = new NextRequest('http://localhost:3000/api/agent/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Session expired');
    });
  });

  // ---------------------------------------------------------------------------
  // Success Cases
  // ---------------------------------------------------------------------------

  describe('Success Cases', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return all tasks for authenticated user', async () => {
      const mockTasks = createMockTasksWithClient(3);
      mockTaskService.getTasksByAgent.mockResolvedValue(mockTasks);

      const request = new NextRequest('http://localhost:3000/api/agent/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(3);
      expect(mockTaskService.getTasksByAgent).toHaveBeenCalledWith(
        TEST_IDS.USER_1,
        undefined
      );
    });

    it('should return empty array when user has no tasks', async () => {
      mockTaskService.getTasksByAgent.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/agent/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(0);
    });

    it('should include client_name in returned tasks', async () => {
      const mockTasks = createMockTasksWithClient(1, { client_name: 'John Doe' });
      mockTaskService.getTasksByAgent.mockResolvedValue(mockTasks);

      const request = new NextRequest('http://localhost:3000/api/agent/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks[0].client_name).toBe('John Doe');
    });
  });

  // ---------------------------------------------------------------------------
  // Filter Tests
  // ---------------------------------------------------------------------------

  describe('Filtering', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
      mockTaskService.getTasksByAgent.mockResolvedValue([]);
    });

    it('should filter by status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?status=todo'
      );
      await GET(request);

      expect(mockTaskService.getTasksByAgent).toHaveBeenCalledWith(
        TEST_IDS.USER_1,
        expect.objectContaining({ status: 'todo' })
      );
    });

    it('should filter by priority', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?priority=high'
      );
      await GET(request);

      expect(mockTaskService.getTasksByAgent).toHaveBeenCalledWith(
        TEST_IDS.USER_1,
        expect.objectContaining({ priority: 'high' })
      );
    });

    it('should filter by due_before date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?due_before=2026-01-31'
      );
      await GET(request);

      expect(mockTaskService.getTasksByAgent).toHaveBeenCalledWith(
        TEST_IDS.USER_1,
        expect.objectContaining({ due_before: '2026-01-31' })
      );
    });

    it('should filter by due_after date', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?due_after=2026-01-01'
      );
      await GET(request);

      expect(mockTaskService.getTasksByAgent).toHaveBeenCalledWith(
        TEST_IDS.USER_1,
        expect.objectContaining({ due_after: '2026-01-01' })
      );
    });

    it('should combine multiple filters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?status=todo&priority=high&due_before=2026-01-31'
      );
      await GET(request);

      expect(mockTaskService.getTasksByAgent).toHaveBeenCalledWith(
        TEST_IDS.USER_1,
        expect.objectContaining({
          status: 'todo',
          priority: 'high',
          due_before: '2026-01-31',
        })
      );
    });

    it('should ignore empty filter values', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?status=&priority='
      );
      await GET(request);

      // Should be called without filters (empty values ignored)
      expect(mockTaskService.getTasksByAgent).toHaveBeenCalledWith(
        TEST_IDS.USER_1,
        undefined
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Validation Error Tests
  // ---------------------------------------------------------------------------

  describe('Validation Errors', () => {
    beforeEach(() => {
      mockGetSessionUser.mockResolvedValue(createMockSessionUser());
    });

    it('should return 400 for invalid status value', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?status=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid filter parameters');
      expect(data.details).toBeDefined();
    });

    it('should return 400 for invalid priority value', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?priority=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid filter parameters');
    });

    it('should return 400 for invalid date format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/agent/tasks?due_before=not-a-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid filter parameters');
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
      mockTaskService.getTasksByAgent.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/agent/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should return 500 with generic message for unknown errors', async () => {
      mockTaskService.getTasksByAgent.mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/agent/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
