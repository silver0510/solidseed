/**
 * API Routes: Individual Client Operations
 *
 * Endpoints:
 * - GET /api/clients/:id - Retrieve client with related counts
 * - PATCH /api/clients/:id - Update client
 * - DELETE /api/clients/:id - Soft delete client
 *
 * All endpoints respect Row Level Security (RLS) policies:
 * - Users can only access/modify their own clients
 * - Soft-deleted clients are excluded from results
 * - Authentication required (401 if not authenticated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientService } from '@/services/ClientService';
import { updateClientSchema } from '@/lib/validation/client';
import { z } from 'zod';

// Initialize ClientService (shared across all endpoints)
const clientService = new ClientService();

/**
 * GET /api/clients/:id
 *
 * Retrieve a single client by ID with related data counts:
 * - documents_count: Number of documents
 * - notes_count: Number of notes
 * - tasks_count: Number of tasks
 *
 * @param params.id - Client ID to retrieve
 * @returns 200 with client object, or 404 if not found
 *
 * @example
 * ```typescript
 * // Request
 * GET /api/clients/client_123
 *
 * // Response (200 OK)
 * {
 *   "id": "client_123",
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "+1-555-123-4567",
 *   "documents_count": 5,
 *   "notes_count": 3,
 *   "tasks_count": 2,
 *   "created_at": "2026-01-13T10:00:00Z",
 *   "updated_at": "2026-01-13T10:00:00Z"
 * }
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientService.getClientById(params.id);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/:id
 *
 * Update one or more fields of an existing client.
 * Only provided fields are updated; omitted fields remain unchanged.
 *
 * Request body is validated using updateClientSchema (partial validation).
 *
 * @param params.id - Client ID to update
 * @param body - Partial client data (name, email, phone, birthday, address)
 * @returns 200 with updated client, 404 if not found, 400 if validation fails
 *
 * @example
 * ```typescript
 * // Request
 * PATCH /api/clients/client_123
 * {
 *   "phone": "+1-555-999-8888",
 *   "address": "456 Oak Ave, New York, NY 10001"
 * }
 *
 * // Response (200 OK)
 * {
 *   "id": "client_123",
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "phone": "+1-555-999-8888",
 *   "address": "456 Oak Ave, New York, NY 10001",
 *   "updated_at": "2026-01-13T12:00:00Z"
 * }
 * ```
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = updateClientSchema.parse(body);

    // Update client
    const client = await clientService.updateClient(params.id, validatedData);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/:id
 *
 * Soft delete a client by setting is_deleted = true.
 * This is NOT a hard delete - the record remains in the database
 * for audit purposes but will be filtered out from all queries.
 *
 * GDPR compliance: Soft-deleted clients can still be permanently
 * removed later through a separate data export/deletion process.
 *
 * @param params.id - Client ID to delete
 * @returns 204 No Content on success, 404 if not found
 *
 * @example
 * ```typescript
 * // Request
 * DELETE /api/clients/client_123
 *
 * // Response (204 No Content)
 * // Empty response body
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await clientService.softDeleteClient(params.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // 204 No Content - successful deletion with no response body
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
