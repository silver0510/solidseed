/**
 * API Route: /api/client-statuses/reorder
 *
 * Handles reordering of client statuses.
 *
 * POST - Reorder statuses by providing ordered array of status IDs
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientStatusService } from '@/services/ClientStatusService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

const statusService = new ClientStatusService();

// Validation schema for reordering
const reorderSchema = z.object({
  statusIds: z.array(z.string().uuid()).min(1, 'At least one status ID is required'),
});

/**
 * POST /api/client-statuses/reorder
 *
 * Reorder client statuses by providing an ordered array of status IDs
 *
 * Request body:
 * - statusIds: string[] (required) - Array of status IDs in desired order
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
    const { statusIds } = reorderSchema.parse(body);

    await statusService.reorderStatuses(statusIds, user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
