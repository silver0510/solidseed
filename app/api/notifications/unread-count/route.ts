/**
 * API Route: /api/notifications/unread-count
 *
 * Fast endpoint for unread notification count (sidebar badge)
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getSessionUser } from '@/lib/auth/session';

const notificationService = new NotificationService();

/**
 * GET /api/notifications/unread-count
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

    const count = await notificationService.getUnreadCount(user.id);

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
