/**
 * API Route: /api/user-tags
 *
 * Handles user tag template management operations.
 * All routes require Better Auth session authentication.
 *
 * GET - List all tags for the authenticated user
 * POST - Create a new user tag
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserTagService } from '@/services/UserTagService';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

const tagService = new UserTagService();

// Validation schema for creating a tag
const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  color: z.string().min(1, 'Color is required'),
});

/**
 * GET /api/user-tags
 *
 * List all user tags for the authenticated user, ordered by name
 */
export async function GET() {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const tags = await tagService.listTags(user.id);
    return NextResponse.json(tags, { status: 200 });
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
 * POST /api/user-tags
 *
 * Create a new user tag
 *
 * Request body:
 * - name: string (required) - Tag name
 * - color: string (required) - Tag color (from preset palette)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTagSchema.parse(body);

    const tag = await tagService.createTag(validatedData, user.id);
    return NextResponse.json(tag, { status: 201 });
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
