/**
 * API Route: /api/clients/[id]/activities
 *
 * Handles activity log retrieval for a specific client.
 * All routes require Better Auth session authentication.
 *
 * GET - List activities for a specific client
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogService } from '@/services/ActivityLogService';
import { getSessionUser } from '@/lib/auth/session';
import type { ActivityType } from '@/lib/types/client';

const activityService = new ActivityLogService();

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/clients/[id]/activities
 *
 * List activities for a specific client
 *
 * Query parameters:
 * - limit: number (optional) - Number of activities to return (default: 10, max: 100)
 * - cursor: string (optional) - Pagination cursor (created_at timestamp)
 * - activity_type: string (optional) - Filter by activity type
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

    const { id: clientId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse limit
    const limitParam = searchParams.get('limit');
    let limit: number | undefined;
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter. Must be a positive integer.' },
          { status: 400 }
        );
      }
    }

    const queryParams = {
      limit,
      cursor: searchParams.get('cursor') || undefined,
      activity_type: searchParams.get('activity_type') as ActivityType | undefined,
    };

    const result = await activityService.getClientActivities(clientId, user.id, queryParams);
    return NextResponse.json(result, { status: 200 });
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
