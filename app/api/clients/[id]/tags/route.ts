/**
 * API Route: /api/clients/:id/tags
 *
 * Handles tag operations for a specific client.
 *
 * POST - Add a tag to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { TagService } from '@/services/TagService';
import { createTagSchema } from '@/lib/validation/tag';
import { getSessionUser } from '@/lib/auth/session';
import { logActivityAsync } from '@/services/ActivityLogService';
import { z } from 'zod';

// Initialize TagService
const tagService = new TagService();

/**
 * POST /api/clients/:id/tags
 *
 * Add a tag to a client
 *
 * Request body:
 * - tag_name: string (required) - Tag label (1-100 characters)
 *
 * Response:
 * - 201: Tag created successfully
 * - 400: Validation error or duplicate tag
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/tags', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ tag_name: 'VIP' })
 * });
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    // Validate client ID is provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = createTagSchema.parse(body);

    // Get user for activity logging
    const { user } = await getSessionUser();

    // Create tag using TagService
    const tag = await tagService.addTag(clientId, validatedData);

    // Log activity (fire-and-forget)
    if (user) {
      logActivityAsync(
        {
          activity_type: 'tag.added',
          entity_type: 'tag',
          entity_id: tag.id,
          client_id: clientId,
          metadata: { tag_name: tag.tag_name },
        },
        user.id
      );
    }

    // Return created tag with 201 status
    return NextResponse.json(tag, { status: 201 });
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
      // Authentication error
      if (error.message.includes('Not authenticated')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Duplicate tag error
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Tag already exists on this client' },
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
