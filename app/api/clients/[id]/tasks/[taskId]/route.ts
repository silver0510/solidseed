/**
 * API Route: /api/clients/:id/tasks/:taskId
 *
 * Handles operations on a specific client task.
 * All endpoints require Better Auth session authentication.
 *
 * PATCH - Update a task
 * DELETE - Remove a task from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/services/TaskService';
import { updateTaskSchema } from '@/lib/validation/task';
import { getSessionUser } from '@/lib/auth/session';
import { logActivityAsync } from '@/services/ActivityLogService';
import { notifyAsync } from '@/services/NotificationService';
import { z } from 'zod';

// Initialize TaskService
const taskService = new TaskService();

/**
 * PATCH /api/clients/:id/tasks/:taskId
 *
 * Update a task
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: clientId, taskId } = await params;

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

    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    const task = await taskService.updateTask(clientId, taskId, validatedData, user.id);

    // Log activity for task completion
    if (validatedData.status === 'closed') {
      logActivityAsync(
        {
          activity_type: 'task.completed',
          entity_type: 'task',
          entity_id: task.id,
          client_id: clientId,
          metadata: { task_title: task.title },
        },
        user.id
      );

      // Notify task creator (if different from completer)
      if (task.created_by !== user.id) {
        notifyAsync({
          user_id: task.created_by,
          type: 'task.completed',
          category: 'task',
          title: 'Task Completed',
          message: `"${task.title}" has been completed`,
          entity_type: 'task',
          entity_id: task.id,
          metadata: {
            task_title: task.title,
            client_id: clientId,
            completed_by: user.id,
            action_url: `/clients/${clientId}?tab=tasks`,
          },
        });
      }
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('0 rows')) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

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
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: clientId, taskId } = await params;

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

    await taskService.deleteTask(clientId, taskId, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
