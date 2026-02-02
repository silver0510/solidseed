/**
 * API Route: /api/user-preferences
 *
 * Handles user deal type preferences for onboarding and settings.
 * All routes require Better Auth session authentication.
 *
 * GET - Get current user's preferences
 * POST - Create or update user's preferences
 * PATCH - Mark onboarding as completed
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserPreferencesService } from '@/services/UserPreferencesService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

// Initialize service
const preferencesService = new UserPreferencesService();

// Validation schema for updating preferences
const updatePreferencesSchema = z.object({
  residential_sale_enabled: z.boolean().optional(),
  mortgage_loan_enabled: z.boolean().optional(),
}).refine(
  (data) => {
    // At least one must be enabled
    if (data.residential_sale_enabled === false && data.mortgage_loan_enabled === false) {
      return false;
    }
    return true;
  },
  {
    message: 'At least one deal type must be enabled',
  }
);

/**
 * GET /api/user-preferences
 *
 * Get the current user's deal type preferences.
 * If preferences don't exist yet, creates default preferences.
 *
 * Response:
 * - 200: User preferences
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

    // Get or create preferences
    const preferences = await preferencesService.getOrCreatePreferences(user.id);

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-preferences
 *
 * Create or update the current user's deal type preferences.
 *
 * Request body:
 * {
 *   residential_sale_enabled?: boolean,
 *   mortgage_loan_enabled?: boolean
 * }
 *
 * Response:
 * - 200: Updated preferences
 * - 400: Validation error
 * - 401: Not authenticated
 * - 500: Internal server error
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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Get or create preferences first
    const existing = await preferencesService.getOrCreatePreferences(user.id);

    // Update preferences
    const updatedPreferences = await preferencesService.updatePreferences(
      user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-preferences
 *
 * Mark onboarding as completed for the current user.
 *
 * Response:
 * - 200: Updated preferences with onboarding_completed = true
 * - 401: Not authenticated
 * - 500: Internal server error
 */
export async function PATCH(request: NextRequest) {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    // Get or create preferences first (in case they don't exist)
    await preferencesService.getOrCreatePreferences(user.id);

    // Mark onboarding as completed
    const updatedPreferences = await preferencesService.completeOnboarding(user.id);

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
