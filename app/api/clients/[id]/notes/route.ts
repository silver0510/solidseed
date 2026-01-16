/**
 * API Route: /api/clients/:id/notes
 *
 * Handles note operations for a specific client.
 * All endpoints require Better Auth session authentication.
 *
 * GET - Get all notes for the client
 * POST - Add a new note to the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { NoteService } from '@/services/NoteService';
import { createNoteSchema } from '@/lib/validation/note';
import { getSessionUser } from '@/lib/auth/session';
import { z } from 'zod';

// Initialize NoteService
const noteService = new NoteService();

/**
 * GET /api/clients/:id/notes
 *
 * Get all notes for a client
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

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const notes = await noteService.getNotesByClient(clientId, user.id);

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/:id/notes
 *
 * Add a note to a client
 */
export async function POST(
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

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createNoteSchema.parse(body);

    const note = await noteService.addNote(clientId, validatedData, user.id);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
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
