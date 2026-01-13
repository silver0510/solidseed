/**
 * API Route: /api/clients
 *
 * Handles client management operations.
 *
 * POST - Create a new client
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientService } from '@/services/ClientService';
import { createClientSchema } from '@/lib/validation/client';
import { z } from 'zod';

// Initialize ClientService
const clientService = new ClientService();

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
    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = createClientSchema.parse(body);

    // Create client using ClientService
    const client = await clientService.createClient(validatedData);

    // Return created client with 201 status
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
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
