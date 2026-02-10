/**
 * API Route: /api/notifications
 *
 * Handles notification listing and retrieval.
 * Includes lazy evaluation for due/overdue tasks.
 *
 * GET - List notifications with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getSessionUser } from '@/lib/auth/session';
import type { NotificationFilters } from '@/lib/types/notification';

const notificationService = new NotificationService();

/**
 * GET /api/notifications
 *
 * List notifications for the authenticated user
 * Query params: category, read, limit, cursor
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters: NotificationFilters = {};

    if (searchParams.has('category')) {
      filters.category = searchParams.get('category') as NotificationFilters['category'];
    }

    if (searchParams.has('read')) {
      const readParam = searchParams.get('read');
      filters.read = readParam === 'true' ? true : readParam === 'false' ? false : undefined;
    }

    if (searchParams.has('limit')) {
      filters.limit = parseInt(searchParams.get('limit') || '20', 10);
    }

    if (searchParams.has('cursor')) {
      filters.cursor = searchParams.get('cursor') || undefined;
    }

    // Lazy evaluation: Check for due/overdue tasks
    // Fire-and-forget - don't wait for completion
    notificationService.evaluateTaskNotifications(user.id).catch((error) => {
      console.error('Lazy evaluation failed:', error);
    });

    // Fetch notifications
    const result = await notificationService.list(user.id, filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
