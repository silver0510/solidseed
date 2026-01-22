/**
 * API Route: /api/clients
 *
 * Handles client management operations.
 * All routes require Better Auth session authentication.
 *
 * GET - List clients with pagination, search, and filtering
 * POST - Create a new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientService } from '@/services/ClientService';
import { createClientSchema } from '@/lib/validation/client';
import { getSessionUser } from '@/lib/auth/session';
import { logActivityAsync } from '@/services/ActivityLogService';
import type { ListClientsParams } from '@/lib/types/client';
import { z } from 'zod';

// Initialize ClientService (uses service role key)
const clientService = new ClientService();

/**
 * GET /api/clients
 *
 * List clients with pagination, search, and filtering
 *
 * Query parameters:
 * - cursor: string (optional) - Pagination cursor (created_at timestamp)
 * - limit: number (optional) - Items per page (default: 20, max: 100)
 * - search: string (optional) - Search by name or email
 * - tag: string (optional) - Filter by tag name
 * - status: string (optional) - Filter by status ID
 * - sort: 'created_at' | 'name' (optional) - Sort field (default: created_at)
 *
 * Response:
 * - 200: Paginated client list
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * // Get first page
 * const response = await fetch('/api/clients?limit=20');
 *
 * // Get next page
 * const response = await fetch('/api/clients?cursor=2026-01-13T10:00:00Z&limit=20');
 *
 * // Search clients
 * const response = await fetch('/api/clients?search=john&limit=10');
 *
 * // Filter by tag
 * const response = await fetch('/api/clients?tag=VIP&limit=50');
 * ```
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

    const searchParams = request.nextUrl.searchParams;

    // Parse and validate query parameters
    const limitParam = searchParams.get('limit');
    const sortParam = searchParams.get('sort');

    // Validate limit is a positive integer
    let limit: number | undefined;
    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter. Must be a positive integer.' },
          { status: 400 }
        );
      }
    }

    // Validate sort parameter
    if (sortParam && !['created_at', 'name', 'updated_at'].includes(sortParam)) {
      return NextResponse.json(
        { error: 'Invalid sort parameter. Must be "created_at", "name", or "updated_at".' },
        { status: 400 }
      );
    }

    const params: ListClientsParams = {
      cursor: searchParams.get('cursor') || undefined,
      limit,
      search: searchParams.get('search') || undefined,
      tag: searchParams.get('tag') || undefined,
      status: searchParams.get('status') || undefined,
      sort: sortParam as 'created_at' | 'name' | undefined,
    };

    // Get paginated clients for the authenticated user
    const result = await clientService.listClients(params, user.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
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
 * POST /api/clients
 *
 * Create a new client
 *
 * Request body:
 * - name: string (required) - Client's full name
 * - email: string (required) - Client's email address
 * - phone: string (optional) - Client's phone in format +1-XXX-XXX-XXXX
 * - birthday: string (optional) - Client's birthday (ISO date)
 * - address: string (optional) - Client's address
 *
 * Response:
 * - 201: Client created successfully
 * - 400: Validation error or duplicate email/phone
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: "John Doe",
 *     email: "john@example.com",
 *     phone: "+1-555-123-4567"
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
    const validatedData = createClientSchema.parse(body);

    // Create client for the authenticated user
    const client = await clientService.createClient(validatedData, user.id);

    // Log activity (fire-and-forget)
    logActivityAsync(
      {
        activity_type: 'client.created',
        entity_type: 'client',
        entity_id: client.id,
        client_id: client.id,
        metadata: { client_name: client.name },
      },
      user.id
    );

    // Return created client with 201 status
    return NextResponse.json(client, { status: 201 });
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
      // Duplicate email/phone error
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Email or phone already exists' },
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
