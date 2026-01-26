/**
 * API Route: /api/deals/[id]/activities
 *
 * Add manual activities to a deal
 *
 * POST - Create a custom activity
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/services/DealService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';
import type { CreateActivityInput, ActivityType } from '@/lib/types/deals';

// Initialize DealService
const dealService = new DealService();

// Valid activity types
const VALID_ACTIVITY_TYPES: ActivityType[] = [
  'stage_change',
  'note',
  'call',
  'email',
  'meeting',
  'showing',
  'document_upload',
  'document_delete',
  'milestone_complete',
  'field_update',
  'other',
];

// Validation schema for creating activities
const createActivitySchema = z.object({
  activity_type: z.enum(VALID_ACTIVITY_TYPES as [ActivityType, ...ActivityType[]]).refine(
    (val) => VALID_ACTIVITY_TYPES.includes(val),
    { message: `Activity type must be one of: ${VALID_ACTIVITY_TYPES.join(', ')}` }
  ),
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
});

/**
 * POST /api/deals/[id]/activities
 *
 * Add manual activity (note, call, meeting, etc.)
 *
 * Request body:
 * - activity_type: string (required) - One of: note, call, email, meeting, showing, other
 * - title: string (required) - Activity summary (max 255 chars)
 * - description: string (optional) - Detailed description (max 2000 chars)
 *
 * Response:
 * - 201: Activity created successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/deals/uuid/activities', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     activity_type: 'call',
 *     title: 'Called client about closing date',
 *     description: 'Discussed moving closing to March 20th. Client agreed.'
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

    // Validate input using Zod schema
    const validatedData = createActivitySchema.parse(body);

    // Create activity
    const activity = await dealService.createActivity(
      id,
      validatedData as CreateActivityInput,
      user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: activity.id,
          activity_type: activity.activity_type,
          title: activity.title,
          created_at: activity.created_at,
        },
      },
      { status: 201 }
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
