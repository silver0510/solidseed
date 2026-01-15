/**
 * API Route: /api/clients/:id/tags/:tagId
 *
 * Handles operations on a specific client tag.
 *
 * DELETE - Remove a tag from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { TagService } from '@/services/TagService';

// Initialize TagService
const tagService = new TagService();

/**
 * DELETE /api/clients/:id/tags/:tagId
 *
 * Remove a tag from a client
 *
 * Response:
 * - 200: Tag removed successfully
 * - 400: Invalid request
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/tags/tag_456', {
 *   method: 'DELETE',
 * });
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id: clientId, tagId } = await params;

    // Validate IDs are provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!tagId) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    // Remove tag using TagService
    await tagService.removeTag(clientId, tagId);

    // Return success response
    return NextResponse.json(
      { message: 'Tag removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
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
