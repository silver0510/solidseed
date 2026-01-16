/**
 * API Route: /api/clients/:id/notes/:noteId
 *
 * Handles operations on a specific client note.
 * All endpoints require Better Auth session authentication.
 *
 * PATCH - Update a note
 * DELETE - Remove a note from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/services/NoteService';
import { updateNoteSchema } from '@/lib/validation/note';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

// Initialize NoteService
const noteService = new NoteService();

/**
 * PATCH /api/clients/:id/notes/:noteId
 *
 * Update a note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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

    const { id: clientId, noteId } = await params;

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

    const body = await request.json();
    const validatedData = updateNoteSchema.parse(body);

    const note = await noteService.updateNote(clientId, noteId, validatedData, user.id);

    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('0 rows')) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message },
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
 * DELETE /api/clients/:id/notes/:noteId
 *
 * Remove a note from a client
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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

    const { id: clientId, noteId } = await params;

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

    await noteService.deleteNote(clientId, noteId, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
