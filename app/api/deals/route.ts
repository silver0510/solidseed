/**
 * API Route: /api/deals
 *
 * Handles deal management operations.
 * All routes require Better Auth session authentication.
 *
 * GET - List deals with optional filtering
 * POST - Create a new deal
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealService } from '@/services/DealService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';
import type { CreateDealInput } from '@/lib/types/deals';

// Initialize DealService
const dealService = new DealService();

// Validation schema for creating deals
const createDealSchema = z.object({
  deal_type_id: z.string().uuid('Invalid deal type ID'),
  client_id: z.string().uuid('Invalid client ID'),
  deal_name: z.string().optional(),
  secondary_client_ids: z.array(z.string().uuid()).optional(),
  deal_value: z.number().min(0, 'Deal value must be non-negative').optional(),
  commission_rate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100').optional(),
  commission_split_percent: z.number().min(0).max(100, 'Commission split must be between 0 and 100').optional(),
  expected_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (use YYYY-MM-DD)').optional().or(z.literal('')),
  deal_data: z.object({}).passthrough(),
  notes: z.string().optional(),
  referral_source: z.string().optional(),
});

/**
 * GET /api/deals
 *
 * List deals with optional filtering
 *
 * Query parameters:
 * - client_id: string (optional) - Filter deals by client ID
 * - status: string (optional) - Filter by status (active, pending, closed_won, closed_lost, cancelled)
 * - deal_type_id: string (optional) - Filter by deal type
 * - limit: number (optional) - Number of deals to return (default: 20, max: 100)
 *
 * Response:
 * - 200: List of deals
 * - 401: Not authenticated
 * - 500: Internal server error
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id') || undefined;
    const status = searchParams.get('status') || undefined;
    const dealTypeId = searchParams.get('deal_type_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch deals using DealService
    const deals = await dealService.getDeals(
      {
        client_id: clientId,
        status,
        deal_type_id: dealTypeId,
        limit,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        deals,
        total: deals.length,
      },
    });
  } catch (error) {
    console.error('GET /api/deals error:', error);
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

/**
 * POST /api/deals
 *
 * Create a new deal
 *
 * Request body:
 * - deal_type_id: string (required) - UUID of the deal type
 * - client_id: string (required) - UUID of the primary client
 * - deal_name: string (optional) - Auto-generated if not provided
 * - deal_value: number (optional) - Total value of the deal
 * - commission_rate: number (optional) - Commission rate percentage
 * - commission_split_percent: number (optional) - Agent's split percentage
 * - expected_close_date: string (optional) - Expected close date (YYYY-MM-DD)
 * - deal_data: object (required) - Deal-specific data (property address, loan info, etc.)
 *
 * Response:
 * - 201: Deal created successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/deals', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     deal_type_id: "uuid",
 *     client_id: "uuid",
 *     deal_value: 450000,
 *     commission_rate: 3.0,
 *     commission_split_percent: 80,
 *     expected_close_date: "2026-03-15",
 *     deal_data: {
 *       property_address: "123 Main St, City, ST 12345",
 *       deal_side: "buyer_side",
 *       listing_price: 465000
 *     }
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
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
    const validatedData = createDealSchema.parse(body);

    // Create deal for the authenticated user
    const deal = await dealService.createDeal(validatedData as CreateDealInput, user.id);

    // Return created deal with 201 status
    return NextResponse.json(
      {
        success: true,
        data: {
          id: deal.id,
          deal_name: deal.deal_name,
          current_stage: deal.current_stage,
          status: deal.status,
          commission_amount: deal.commission_amount,
          agent_commission: deal.agent_commission,
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

    // Handle specific error messages
    if (error instanceof Error) {
      // Invalid deal type or client
      if (error.message.includes('Invalid deal type') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Generic error
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    // Unknown error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
