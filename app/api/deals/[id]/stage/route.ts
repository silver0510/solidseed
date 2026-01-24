/**
 * API Route: /api/deals/[id]/stage
 *
 * Change deal stage with automatic milestone creation
 *
 * PATCH - Change deal stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/services/DealService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';
import type { ChangeDealStageInput } from '@/lib/types/deals';

// Initialize DealService
const dealService = new DealService();

// Validation schema for stage changes
const changeStageSchema = z.object({
  new_stage: z.string().min(1, 'New stage is required'),
  lost_reason: z.string().min(10, 'Lost reason must be at least 10 characters').optional(),
});

/**
 * PATCH /api/deals/[id]/stage
 *
 * Change deal stage
 *
 * Request body:
 * - new_stage: string (required) - New stage code
 * - lost_reason: string (optional) - Required if new_stage is 'lost', minimum 10 characters
 *
 * Side effects:
 * - Creates activity log entry
 * - Auto-creates milestones when moving to trigger stages (contract/application)
 * - Updates status if moving to terminal stages
 * - Sets closed_at timestamp for closed/lost stages
 *
 * Response:
 * - 200: Stage changed successfully
 * - 400: Validation error or invalid stage
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * // Change to contract stage (triggers milestone creation)
 * const response = await fetch('/api/deals/uuid/stage', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     new_stage: 'contract'
 *   })
 * });
 *
 * // Mark as lost with reason
 * const response = await fetch('/api/deals/uuid/stage', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     new_stage: 'lost',
 *     lost_reason: 'Client went with another agent'
 *   })
 * });
 * ```
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = changeStageSchema.parse(body);

    // Validate lost_reason if moving to lost stage
    if (validatedData.new_stage === 'lost') {
      if (!validatedData.lost_reason || validatedData.lost_reason.length < 10) {
        return NextResponse.json(
          { error: 'Lost reason is required and must be at least 10 characters when marking deal as lost' },
          { status: 400 }
        );
      }
    }

    // Change stage
    const result = await dealService.changeDealStage(
      params.id,
      validatedData as ChangeDealStageInput,
      user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.deal.id,
          current_stage: result.deal.current_stage,
          status: result.deal.status,
          milestones_created: result.milestones_created,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Deal not found or access denied
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'Deal not found or access denied' },
          { status: 404 }
        );
      }

      // Invalid stage
      if (error.message.includes('Invalid stage')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Lost reason validation
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
