/**
 * API Route: /api/agent/tasks
 *
 * Handles task operations for the authenticated agent's dashboard.
 *
 * GET - Get all tasks assigned to the current agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/services/TaskService';
import { taskFiltersSchema } from '@/lib/validation/task';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

// Initialize TaskService
const taskService = new TaskService();

/**
 * GET /api/agent/tasks
 *
 * Get all tasks assigned to the current agent
 *
 * Query parameters (all optional):
 * - status: 'todo' | 'in_progress' | 'closed' - Filter by task status
 * - priority: 'low' | 'medium' | 'high' - Filter by priority
 * - due_before: string - Filter tasks due before this date (YYYY-MM-DD)
 * - due_after: string - Filter tasks due after this date (YYYY-MM-DD)
 *
 * Response:
 * - 200: Array of tasks with client information
 * - 400: Invalid filter parameters
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * // Get all tasks
 * const response = await fetch('/api/agent/tasks');
 *
 * // Get pending high-priority tasks
 * const response = await fetch('/api/agent/tasks?status=pending&priority=high');
 *
 * // Get tasks due within the next week
 * const response = await fetch('/api/agent/tasks?due_before=2026-01-22');
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    // Get filter parameters from URL
    const searchParams = request.nextUrl.searchParams;

    // Build filters object
    const filtersInput: Record<string, string | undefined> = {};

    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const dueBefore = searchParams.get('due_before');
    const dueAfter = searchParams.get('due_after');

    if (status) filtersInput.status = status;
    if (priority) filtersInput.priority = priority;
    if (dueBefore) filtersInput.due_before = dueBefore;
    if (dueAfter) filtersInput.due_after = dueAfter;

    // Validate filters using Zod schema
    const filters = Object.keys(filtersInput).length > 0
      ? taskFiltersSchema.parse(filtersInput)
      : undefined;

    // Get tasks using TaskService
    console.log('[API] getTasksByAgent for user:', user.id, 'filters:', filters);
    const tasks = await taskService.getTasksByAgent(user.id, filters);
    console.log('[API] Tasks returned:', tasks.length);

    // Return tasks
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid filter parameters',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle specific error messages
    if (error instanceof Error) {
      // Authentication error
      if (error.message.includes('Not authenticated')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      console.error('[API] Error in getTasksByAgent:', error.message);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    // Unknown error
    console.error('[API] Unknown error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
