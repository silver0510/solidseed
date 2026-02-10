/**
 * API Route: /api/notifications/read-all
 *
 * Mark all notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getSessionUser } from '@/lib/auth/session';

const notificationService = new NotificationService();

/**
 * PATCH /api/notifications/read-all
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const count = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({ count, message: `Marked ${count} notifications as read` }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
