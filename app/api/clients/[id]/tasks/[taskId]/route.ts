/**
 * API Route: /api/clients/:id/tasks/:taskId
 *
 * Handles operations on a specific client task.
 *
 * PATCH - Update a task
 * DELETE - Remove a task from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/services/TaskService';
import { updateTaskSchema } from '@/lib/validation/task';
import { z } from 'zod';

// Initialize TaskService
const taskService = new TaskService();

/**
 * PATCH /api/clients/:id/tasks/:taskId
 *
 * Update a task
 *
 * Request body:
 * - title: string (optional) - Updated task title
 * - description: string (optional) - Updated task description
 * - due_date: string (optional) - Updated due date in YYYY-MM-DD format
 * - priority: 'low' | 'medium' | 'high' (optional)
 * - status: 'pending' | 'completed' (optional)
 *
 * Response:
 * - 200: Task updated successfully
 * - 400: Validation error
 * - 404: Task not found
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/tasks/task_456', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     status: 'completed'
 *   })
 * });
 * ```
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: clientId, taskId } = await params;

    // Validate IDs are provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = updateTaskSchema.parse(body);

    // Update task using TaskService
    const task = await taskService.updateTask(clientId, taskId, validatedData);

    // Return updated task
    return NextResponse.json(task, { status: 200 });
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
      // Not found error
      if (error.message.includes('0 rows')) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

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
 * DELETE /api/clients/:id/tasks/:taskId
 *
 * Remove a task from a client
 *
 * Response:
 * - 200: Task removed successfully
 * - 400: Invalid request
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/tasks/task_456', {
 *   method: 'DELETE',
 * });
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: clientId, taskId } = await params;

    // Validate IDs are provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    // Delete task using TaskService
    await taskService.deleteTask(clientId, taskId);

    // Return success response
    return NextResponse.json(
      { message: 'Task removed successfully' },
      { status: 200 }
    );
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
