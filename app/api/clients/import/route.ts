/**
 * API Route: /api/clients/import
 *
 * Handles bulk client import from CSV data.
 * Requires Better Auth session authentication.
 *
 * POST - Import multiple clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientService } from '@/services/ClientService';
import { createClientSchema } from '@/lib/validation/client';
import { getSessionUser } from '@/lib/auth/session';
import { logActivityAsync } from '@/services/ActivityLogService';
import { z } from 'zod';

const clientService = new ClientService();

/**
 * Request body schema for bulk import
 */
const bulkImportSchema = z.object({
  clients: z
    .array(createClientSchema)
    .min(1, 'At least one client is required')
    .max(500, 'Maximum 500 clients per import'),
});

/**
 * POST /api/clients/import
 *
 * Import multiple clients from CSV data.
 *
 * Request body:
 * - clients: Array of client objects (name, email, phone?, birthday?, address?, tags?)
 *
 * Response:
 * - 200: Import results with counts and errors
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

    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = bulkImportSchema.parse(body);

    // Bulk create clients
    const { created, errors } = await clientService.createClientsBulk(
      validatedData.clients,
      user.id
    );

    // Log activity for each created client (fire-and-forget)
    created.forEach((client) => {
      logActivityAsync(
        {
          activity_type: 'client.created',
          entity_type: 'client',
          entity_id: client.id,
          client_id: client.id,
          metadata: { client_name: client.name, source: 'csv_import' },
        },
        user.id
      );
    });

    return NextResponse.json(
      {
        imported: created.length,
        failed: errors.length,
        errors: errors.map((e) => ({
          row: e.index + 1,
          error: e.error,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

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
