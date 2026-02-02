/**
 * API Route: /api/user-tags/[id]
 *
 * Handles individual user tag operations.
 * All routes require Better Auth session authentication.
 *
 * GET - Get a single tag by ID
 * PUT - Update an existing tag
 * DELETE - Delete a tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserTagService } from '@/services/UserTagService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

const tagService = new UserTagService();

// Validation schema for updating a tag
const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().min(1).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/user-tags/[id]
 *
 * Get a single user tag by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const tag = await tagService.getTagById(id, user.id);

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(tag, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user-tags/[id]
 *
 * Update an existing user tag
 *
 * Request body (all optional):
 * - name: string - Tag name
 * - color: string - Tag color
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTagSchema.parse(body);

    const tag = await tagService.updateTag(id, validatedData, user.id);

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json(tag, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/user-tags/[id]
 *
 * Delete a user tag
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const deleted = await tagService.deleteTag(id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    // 204 No Content - successful deletion with no response body
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
