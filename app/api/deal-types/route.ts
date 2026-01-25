/**
 * API Route: /api/deal-types
 *
 * Returns all active deal types for the deal creation form.
 * Requires Better Auth session authentication.
 *
 * GET - List all active deal types
 */

import { NextResponse } from 'next/server';
import { DealService } from '@/services/DealService';
import { getSessionUser } from '@/lib/auth/session';

// Initialize DealService
const dealService = new DealService();

/**
 * GET /api/deal-types
 *
 * List all active deal types
 *
 * Response:
 * - 200: List of deal types
 * - 401: Not authenticated
 * - 500: Internal server error
 */
export async function GET() {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch deal types - return array directly for React Query hook compatibility
    const dealTypes = await dealService.getDealTypes();

    return NextResponse.json(dealTypes);
  } catch (error) {
    console.error('GET /api/deal-types error:', error);
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
