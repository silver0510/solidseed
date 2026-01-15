/**
 * API Route: /api/clients/:id/documents/:docId/download
 *
 * Generates a signed URL for downloading a document.
 *
 * GET - Get signed download URL (1-hour expiry)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/services/DocumentService';

// Initialize DocumentService
const documentService = new DocumentService();

/** Default signed URL expiration time in seconds (1 hour) */
const DEFAULT_URL_EXPIRY = 3600;

/**
 * GET /api/clients/:id/documents/:docId/download
 *
 * Generate a signed URL for document download
 *
 * Response:
 * - 200: { url: string, expires_in: number }
 * - 400: Invalid request
 * - 404: Document not found
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/documents/doc_456/download');
 * const { url, expires_in } = await response.json();
 * // url: "https://storage.supabase.co/object/sign/..."
 * // expires_in: 3600
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

    // Get document first to get the file path
    const document = await documentService.getDocumentById(clientId, docId);

    // Check if document exists
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate signed URL
    const url = await documentService.getDownloadUrl(
      document.file_path,
      DEFAULT_URL_EXPIRY
    );

    // Return signed URL with expiry info
    return NextResponse.json(
      {
        url,
        expires_in: DEFAULT_URL_EXPIRY,
      },
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
