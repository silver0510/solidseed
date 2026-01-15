/**
 * API Route: /api/clients/:id/tasks
 *
 * Handles task operations for a specific client.
 *
 * GET - Get all tasks for the client
 * POST - Add a new task to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/services/TaskService';
import { createTaskSchema } from '@/lib/validation/task';
import { z } from 'zod';

// Initialize TaskService
const taskService = new TaskService();

/**
 * GET /api/clients/:id/tasks
 *
 * Get all tasks for a client
 *
 * Response:
 * - 200: Array of tasks
 * - 400: Invalid request
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/tasks');
 * const tasks = await response.json();
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    // Validate client ID is provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Get tasks using TaskService
    const tasks = await taskService.getTasksByClient(clientId);

    // Return tasks
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    // Unknown error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/:id/tasks
 *
 * Add a task to a client
 *
 * Request body:
 * - title: string (required) - Task title
 * - description: string (optional) - Task description
 * - due_date: string (required) - Due date in YYYY-MM-DD format
 * - priority: 'low' | 'medium' | 'high' (optional, default: 'medium')
 *
 * Response:
 * - 201: Task created successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/tasks', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     title: 'Schedule property viewing',
 *     due_date: '2026-01-20',
 *     priority: 'high'
 *   })
 * });
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    // Validate client ID is provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = createTaskSchema.parse(body);

    // Create task using TaskService
    const task = await taskService.addTask(clientId, validatedData);

    // Return created task with 201 status
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
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

      // Generic error
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    // Unknown error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
