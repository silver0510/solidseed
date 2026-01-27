/**
 * API Route: /api/deals/[id]/mark-lost
 *
 * Mark a deal as lost with a reason
 *
 * POST - Mark deal as lost
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/services/DealService';
import { getSessionUser } from '@/lib/auth/session';

// Initialize DealService
const dealService = new DealService();

/**
 * POST /api/deals/[id]/mark-lost
 *
 * Mark a deal as lost with a reason
 *
 * Request body:
 * - lost_reason: string (required) - Reason for marking deal as lost (minimum 10 characters)
 *
 * Side effects:
 * - Updates deal status to 'closed_lost'
 * - Sets closed_at timestamp
 * - Keeps current_stage at its last position
 * - Cancels all uncompleted milestones
 * - Creates activity log entry
 *
 * Response:
 * - 200: Deal marked as lost successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/deals/uuid/mark-lost', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     lost_reason: 'Client decided to go with another agent'
 *   })
 * });
 * ```
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

    // Get deal ID from params
    const { id } = await params;

    // Parse request body
    const body = await request.json();
    const { lost_reason } = body;

    // Validate lost_reason
    if (!lost_reason || typeof lost_reason !== 'string') {
      return NextResponse.json(
        { error: 'Lost reason is required' },
        { status: 400 }
      );
    }

    if (lost_reason.length < 10) {
      return NextResponse.json(
        { error: 'Lost reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Mark deal as lost
    const deal = await dealService.markDealAsLost(id, lost_reason, user.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: deal.id,
          deal_name: deal.deal_name,
          status: deal.status,
          current_stage: deal.current_stage,
          closed_at: deal.closed_at,
          lost_reason: deal.lost_reason,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      // Deal not found or access denied
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'Deal not found or access denied' },
          { status: 404 }
        );
      }

      // Validation errors
      if (error.message.includes('Lost reason required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
