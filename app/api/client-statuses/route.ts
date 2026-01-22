/**
 * API Route: /api/client-statuses
 *
 * Handles client status management operations.
 * All routes require Better Auth session authentication.
 *
 * GET - List all statuses for the authenticated user
 * POST - Create a new client status
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientStatusService } from '@/services/ClientStatusService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

const statusService = new ClientStatusService();

// Validation schema for creating a status
const createStatusSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  color: z.string().min(1, 'Color is required'),
  position: z.number().int().min(0).optional(),
});

/**
 * GET /api/client-statuses
 *
 * List all client statuses for the authenticated user, ordered by position
 */
export async function GET() {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const statuses = await statusService.listStatuses(user.id);
    return NextResponse.json(statuses, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/client-statuses
 *
 * Create a new client status
 *
 * Request body:
 * - name: string (required) - Status name
 * - color: string (required) - Status color (from preset palette)
 * - position: number (optional) - Display order position
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createStatusSchema.parse(body);

    const status = await statusService.createStatus(validatedData, user.id);
    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
