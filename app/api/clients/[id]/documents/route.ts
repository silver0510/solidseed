/**
 * API Route: /api/clients/:id/documents
 *
 * Handles document operations for a specific client.
 *
 * GET - List all documents for the client
 * POST - Upload a new document (multipart/form-data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/services/DocumentService';
import {
  validateFileType,
  validateFileSize,
  MAX_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS,
} from '@/lib/validation/document';

// Initialize DocumentService
const documentService = new DocumentService();

/**
 * GET /api/clients/:id/documents
 *
 * Get all documents for a client
 *
 * Response:
 * - 200: Array of documents
 * - 400: Invalid request
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/clients/client_123/documents');
 * const { documents } = await response.json();
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

    // Get documents using DocumentService
    const documents = await documentService.getDocumentsByClient(clientId);

    // Return documents
    return NextResponse.json({ documents }, { status: 200 });
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
 * POST /api/clients/:id/documents
 *
 * Upload a document for a client
 *
 * Request body (multipart/form-data):
 * - file: File (required) - The document to upload
 * - description: string (optional) - Document description
 *
 * Response:
 * - 201: Document uploaded successfully
 * - 400: Validation error (missing file, invalid type, size exceeded)
 * - 401: Not authenticated
 * - 500: Internal server error
 *
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', file);
 * formData.append('description', 'Sales contract');
 *
 * const response = await fetch('/api/clients/client_123/documents', {
 *   method: 'POST',
 *   body: formData
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | undefined;

    // Validate file is provided (check for Blob-like object with name)
    if (!file || typeof file !== 'object' || !('name' in file) || !('size' in file)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Cast to File type for type safety
    const uploadFile = file as File;

    // Validate file type
    if (!validateFileType(uploadFile.type)) {
      return NextResponse.json(
        {
          error: `File type not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!validateFileSize(uploadFile.size)) {
      return NextResponse.json(
        {
          error: `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    // Upload document using DocumentService
    const document = await documentService.uploadDocument(
      clientId,
      uploadFile,
      description || undefined
    );

    // Return created document with 201 status
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
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
