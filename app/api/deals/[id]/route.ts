/**
 * API Route: /api/deals/[id]
 *
 * Handles individual deal operations.
 * All routes require Better Auth session authentication.
 *
 * GET - Get a single deal
 * PATCH - Update a deal
 * DELETE - Delete a deal (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/services/DealService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';
import type { UpdateDealInput } from '@/lib/types/deals';

// Initialize DealService
const dealService = new DealService();

// Validation schema for updating deals
const updateDealSchema = z.object({
  deal_name: z.string().optional(),
  deal_value: z.number().min(0, 'Deal value must be non-negative').optional(),
  commission_rate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100').optional(),
  commission_split_percent: z.number().min(0).max(100, 'Commission split must be between 0 and 100').optional(),
  expected_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)').optional(),
  actual_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)').optional(),
  deal_data: z.object({}).passthrough().optional(),
  notes: z.string().optional(),
  referral_source: z.string().optional(),
});

/**
 * GET /api/deals/[id]
 *
 * Get a single deal with all relations
 *
 * Response:
 * - 200: Deal data
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 */
export async function GET(
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

    // Get deal
    const deal = await dealService.getDeal(id, user.id);

    return NextResponse.json(
      {
        success: true,
        data: deal,
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

/**
 * PATCH /api/deals/[id]
 *
 * Update a deal
 *
 * Request body:
 * - deal_name: string (optional)
 * - deal_value: number (optional)
 * - commission_rate: number (optional)
 * - commission_split_percent: number (optional)
 * - expected_close_date: string (optional)
 * - actual_close_date: string (optional)
 * - deal_data: object (optional)
 * - notes: string (optional)
 * - referral_source: string (optional)
 *
 * Response:
 * - 200: Deal updated successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 */
export async function PATCH(
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
    const validatedData = updateDealSchema.parse(body);

    // Update deal
    const deal = await dealService.updateDeal(id, validatedData as UpdateDealInput, user.id);

    return NextResponse.json(
      {
        success: true,
        data: deal,
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

/**
 * DELETE /api/deals/[id]
 *
 * Delete a deal (soft delete)
 *
 * Response:
 * - 200: Deal deleted successfully
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 */
export async function DELETE(
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

    // Delete deal
    await dealService.deleteDeal(id, user.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Deal deleted successfully',
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
