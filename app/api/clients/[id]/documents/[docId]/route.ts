/**
 * API Route: /api/clients/:id/documents/:docId
 *
 * Handles operations on a specific client document.
 * All endpoints require Better Auth session authentication.
 *
 * GET - Get document details
 * DELETE - Remove a document from the client (storage + database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/services/DocumentService';
import { getSessionUser } from '@/lib/auth/session';

// Initialize DocumentService
const documentService = new DocumentService();

/**
 * GET /api/clients/:id/documents/:docId
 *
 * Get a single document by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
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

    const { id: clientId, docId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!docId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await documentService.getDocumentById(clientId, docId, user.id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/:id/documents/:docId
 *
 * Remove a document from a client (deletes from storage and database)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
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

    const { id: clientId, docId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (!docId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    await documentService.deleteDocument(clientId, docId, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
