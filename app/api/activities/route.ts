/**
 * API Route: /api/activities
 *
 * Handles activity log retrieval for dashboard.
 * All routes require Better Auth session authentication.
 *
 * GET - List recent activities for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { ActivityLogService } from '@/services/ActivityLogService';
import { getSessionUser } from '@/lib/auth/session';
import type { ActivityType } from '@/lib/types/client';

const activityService = new ActivityLogService();

/**
 * GET /api/activities
 *
 * List recent activities for the authenticated user
 *
 * Query parameters:
 * - limit: number (optional) - Number of activities to return (default: 10, max: 100)
 * - cursor: string (optional) - Pagination cursor (created_at timestamp)
 * - activity_type: string (optional) - Filter by activity type
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

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

    const params = {
      limit,
      cursor: searchParams.get('cursor') || undefined,
      activity_type: searchParams.get('activity_type') as ActivityType | undefined,
    };

    const result = await activityService.listActivities(params, user.id);
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
