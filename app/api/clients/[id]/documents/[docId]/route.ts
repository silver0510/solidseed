/**
 * API Route: /api/clients/:id/documents/:docId
 *
 * Handles operations on a specific client document.
 *
 * GET - Get document details
 * DELETE - Remove a document from the client (storage + database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/services/DocumentService';

// Initialize DocumentService
const documentService = new DocumentService();

/**
 * GET /api/clients/:id/documents/:docId
 *
 * Get a single document by ID
 *
 * Response:
 * - 200: Document details
 * - 400: Invalid request
 * - 404: Document not found
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/documents/doc_456');
 * const document = await response.json();
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: clientId, docId } = await params;

    // Validate IDs are provided
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

    // Get document using DocumentService
    const document = await documentService.getDocumentById(clientId, docId);

    // Check if document exists
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Return document
    return NextResponse.json(document, { status: 200 });
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
 * DELETE /api/clients/:id/documents/:docId
 *
 * Remove a document from a client (deletes from storage and database)
 *
 * Response:
 * - 204: Document deleted successfully (no content)
 * - 400: Invalid request
 * - 404: Document not found
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/documents/doc_456', {
 *   method: 'DELETE',
 * });
 * // Status: 204 No Content
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: clientId, docId } = await params;

    // Validate IDs are provided
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

    // Get document first to get the file path
    const document = await documentService.getDocumentById(clientId, docId);

    // Check if document exists
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete document using DocumentService (storage + database)
    await documentService.deleteDocument(docId, document.file_path);

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
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
