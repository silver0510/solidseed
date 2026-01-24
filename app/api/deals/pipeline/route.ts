/**
 * API Route: /api/deals/pipeline
 *
 * Get deals for pipeline board grouped by stage
 *
 * GET - Get pipeline view with deals grouped by stage
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/services/DealService';
import { getSessionUser } from '@/lib/auth/session';
import type { GetPipelineParams } from '@/lib/types/deals';

// Initialize DealService
const dealService = new DealService();

/**
 * GET /api/deals/pipeline
 *
 * Get deals for pipeline board grouped by stage
 *
 * Query parameters:
 * - deal_type_id: string (optional) - Filter by deal type UUID
 * - assigned_to: string (optional) - Filter by user UUID (defaults to current user)
 * - limit: number (optional) - Deals per stage (default: 20)
 *
 * Response:
 * - 200: Pipeline data with stages and summary
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * // Get current user's pipeline
 * const response = await fetch('/api/deals/pipeline');
 *
 * // Filter by deal type
 * const response = await fetch('/api/deals/pipeline?deal_type_id=uuid');
 *
 * // Limit deals per stage
 * const response = await fetch('/api/deals/pipeline?limit=10');
 * ```
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

    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const dealTypeId = searchParams.get('deal_type_id') || undefined;
    const assignedTo = searchParams.get('assigned_to') || user.id;
    const limitParam = searchParams.get('limit');

    // Validate limit parameter
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

    const params: GetPipelineParams = {
      deal_type_id: dealTypeId,
      assigned_to: assignedTo,
      limit,
    };

    // Get pipeline deals
    const pipeline = await dealService.getPipelineDeals(params, user.id);

    return NextResponse.json(
      {
        success: true,
        data: pipeline,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
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
