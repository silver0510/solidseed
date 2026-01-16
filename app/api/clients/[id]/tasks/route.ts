/**
 * API Route: /api/clients/:id/tasks
 *
 * Handles task operations for a specific client.
 * All endpoints require Better Auth session authentication.
 *
 * GET - Get all tasks for the client
 * POST - Add a new task to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/services/TaskService';
import { createTaskSchema } from '@/lib/validation/task';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

// Initialize TaskService
const taskService = new TaskService();

/**
 * GET /api/clients/:id/tasks
 *
 * Get all tasks for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const tasks = await taskService.getTasksByClient(clientId, user.id);

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/:id/tasks
 *
 * Add a task to a client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    const task = await taskService.addTask(clientId, validatedData, user.id);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
