/**
 * API Route: /api/clients/:id/documents
 *
 * Handles document operations for a specific client.
 * All endpoints require Better Auth session authentication.
 *
 * GET - List all documents for the client
 * POST - Upload a new document (multipart/form-data)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentService } from '@/services/DocumentService';
import { getSessionUser } from '@/lib/auth/session';
import { logActivityAsync } from '@/services/ActivityLogService';
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

    const documents = await documentService.getDocumentsByClient(clientId, user.id);

    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/:id/documents
 *
 * Upload a document for a client
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | undefined;

    // Validate file is provided
    if (!file || typeof file !== 'object' || !('name' in file) || !('size' in file)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

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

    const document = await documentService.uploadDocument(
      clientId,
      uploadFile,
      user.id,
      description || undefined
    );

    // Log activity (fire-and-forget)
    logActivityAsync(
      {
        activity_type: 'document.uploaded',
        entity_type: 'document',
        entity_id: document.id,
        client_id: clientId,
        metadata: { file_name: document.file_name },
      },
      user.id
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
