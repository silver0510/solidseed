/**
 * API Route: /api/clients/:id/notes/:noteId
 *
 * Handles operations on a specific client note.
 *
 * PATCH - Update a note
 * DELETE - Remove a note from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/services/NoteService';
import { updateNoteSchema } from '@/lib/validation/note';
import { z } from 'zod';

// Initialize NoteService
const noteService = new NoteService();

/**
 * PATCH /api/clients/:id/notes/:noteId
 *
 * Update a note
 *
 * Request body:
 * - content: string (optional) - Updated note content
 * - is_important: boolean (optional) - Updated importance flag
 *
 * Response:
 * - 200: Note updated successfully
 * - 400: Validation error
 * - 404: Note not found
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/notes/note_456', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     content: 'Updated content',
 *     is_important: true
 *   })
 * });
 * ```
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id: clientId, noteId } = await params;

    // Validate IDs are provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = updateNoteSchema.parse(body);

    // Update note using NoteService
    const note = await noteService.updateNote(clientId, noteId, validatedData);

    // Return updated note
    return NextResponse.json(note, { status: 200 });
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
      // Not found error
      if (error.message.includes('0 rows')) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        );
      }

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
 * DELETE /api/clients/:id/notes/:noteId
 *
 * Remove a note from a client
 *
 * Response:
 * - 200: Note removed successfully
 * - 400: Invalid request
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/notes/note_456', {
 *   method: 'DELETE',
 * });
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id: clientId, noteId } = await params;

    // Validate IDs are provided
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    // Delete note using NoteService
    await noteService.deleteNote(clientId, noteId);

    // Return success response
    return NextResponse.json(
      { message: 'Note removed successfully' },
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
