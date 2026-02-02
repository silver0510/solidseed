/**
 * API Route: /api/client-statuses/[id]
 *
 * Handles individual client status operations.
 * All routes require Better Auth session authentication.
 *
 * GET - Get a single status by ID
 * PUT - Update an existing status
 * DELETE - Delete a status (only non-default statuses)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientStatusService } from '@/services/ClientStatusService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

const statusService = new ClientStatusService();

// Validation schema for updating a status
const updateStatusSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().min(1).optional(),
  position: z.number().int().min(0).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/client-statuses/[id]
 *
 * Get a single client status by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const status = await statusService.getStatusById(id, user.id);

    if (!status) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    return NextResponse.json(status, { status: 200 });
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
 * PATCH /api/client-statuses/[id]
 *
 * Update an existing client status
 *
 * Request body (all optional):
 * - name: string - Status name
 * - color: string - Status color
 * - position: number - Display order position
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    const status = await statusService.updateStatus(id, validatedData, user.id);

    if (!status) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    return NextResponse.json(status, { status: 200 });
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

/**
 * DELETE /api/client-statuses/[id]
 *
 * Delete a client status (only non-default statuses)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await statusService.deleteStatus(id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Status not found' }, { status: 404 });
    }

    // 204 No Content - successful deletion with no response body
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('Cannot delete')) {
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
