/**
 * API Route: /api/tags/autocomplete
 *
 * Provides tag suggestions for autocomplete functionality.
 *
 * GET - Get tag suggestions based on search query
 */

import { NextRequest, NextResponse } from 'next/server';
import { TagService } from '@/services/TagService';

// Initialize TagService
const tagService = new TagService();

/**
 * GET /api/tags/autocomplete
 *
 * Get tag suggestions for autocomplete
 *
 * Query parameters:
 * - q: string (optional) - Search query to filter tags
 *
 * Response:
 * - 200: Array of tag suggestions
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/tags/autocomplete?q=VIP');
 * const suggestions = await response.json();
 * // Returns: { tags: ['VIP', 'VIP Client', ...] }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Get search query from URL params
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    // Get tag suggestions using TagService
    const tags = await tagService.getTagAutocomplete(query);

    // Return suggestions
    return NextResponse.json({ tags }, { status: 200 });
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      // Authentication error
      if (error.message.includes('Not authenticated')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

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
