/**
 * API Route: /api/clients/:id/documents/:docId/download
 *
 * Generates a signed URL for downloading a document.
 * All endpoints require Better Auth session authentication.
 *
 * GET - Get signed download URL (1-hour expiry)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/services/DocumentService';
import { getSessionUser } from '@/lib/auth/session';

// Initialize DocumentService
const documentService = new DocumentService();

/** Default signed URL expiration time in seconds (1 hour) */
const DEFAULT_URL_EXPIRY = 3600;

/**
 * GET /api/clients/:id/documents/:docId/download
 *
 * Generate a signed URL for document download
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

    // Get document first to get the file path (this also verifies ownership)
    const document = await documentService.getDocumentById(clientId, docId, user.id);

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

    return NextResponse.json(
      {
        url,
        expires_in: DEFAULT_URL_EXPIRY,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
