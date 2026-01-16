/**
 * API Routes: Individual Client Operations
 *
 * Endpoints:
 * - GET /api/clients/:id - Retrieve client with related counts
 * - PATCH /api/clients/:id - Update client
 * - DELETE /api/clients/:id - Soft delete client
 *
 * All endpoints require Better Auth session authentication.
 * Authorization is enforced by filtering on user ownership.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientService } from '@/services/ClientService';
import { updateClientSchema } from '@/lib/validation/client';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

// Initialize ClientService (uses service role key)
const clientService = new ClientService();

/**
 * GET /api/clients/:id
 *
 * Retrieve a single client by ID with related data counts.
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const client = await clientService.getClientById(id, user.id);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/:id
 *
 * Update one or more fields of an existing client.
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = updateClientSchema.parse(body);

    // Check if at least one field is provided for update
    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Update client
    const client = await clientService.updateClient(id, validatedData, user.id);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error: unknown) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/:id
 *
 * Soft delete a client by setting is_deleted = true.
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const success = await clientService.softDeleteClient(id, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // 204 No Content - successful deletion with no response body
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
