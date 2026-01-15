/**
 * API Route: /api/clients/:id/notes
 *
 * Handles note operations for a specific client.
 *
 * GET - Get all notes for the client
 * POST - Add a new note to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/services/NoteService';
import { createNoteSchema } from '@/lib/validation/note';
import { z } from 'zod';

// Initialize NoteService
const noteService = new NoteService();

/**
 * GET /api/clients/:id/notes
 *
 * Get all notes for a client
 *
 * Response:
 * - 200: Array of notes
 * - 400: Invalid request
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/notes');
 * const notes = await response.json();
 * ```
 */
export async function GET(
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

    // Get notes using NoteService
    const notes = await noteService.getNotesByClient(clientId);

    // Return notes
    return NextResponse.json({ notes }, { status: 200 });
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

/**
 * POST /api/clients/:id/notes
 *
 * Add a note to a client
 *
 * Request body:
 * - content: string (required) - Note content
 * - is_important: boolean (optional) - Mark as important
 *
 * Response:
 * - 201: Note created successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/notes', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     content: 'Called about property viewing',
 *     is_important: true
 *   })
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
    const validatedData = createNoteSchema.parse(body);

    // Create note using NoteService
    const note = await noteService.addNote(clientId, validatedData);

    // Return created note with 201 status
    return NextResponse.json(note, { status: 201 });
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
