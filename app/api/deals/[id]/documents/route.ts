/**
 * API Route: /api/deals/[id]/documents
 *
 * Handles deal document operations.
 * All routes require Better Auth session authentication.
 *
 * POST - Upload a document to a deal
 * GET - List all documents for a deal (with signed download URLs)
 */

import { NextRequest, NextResponse } from 'next/server';
import { DealDocumentService } from '@/services/DealDocumentService';
import { getSessionUser } from '@/lib/auth/session';
import type { DocumentType } from '@/lib/types/deals';

// Initialize DealDocumentService
const documentService = new DealDocumentService();

// Valid document types
const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'contract',
  'disclosure',
  'inspection_report',
  'appraisal',
  'closing_statement',
  'other',
];

/**
 * POST /api/deals/[id]/documents
 *
 * Upload a document to a deal
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - file: File (required, max 25MB, PDF/JPEG/PNG/DOC/DOCX/XLS/XLSX)
 * - document_type: DocumentType (required)
 * - description: string (optional)
 *
 * Response:
 * - 201: Document uploaded successfully
 * - 400: Invalid request (missing file, invalid type, file too large)
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const dealId = params.id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('document_type') as string | null;
    const description = formData.get('description') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate document type
    if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: `Invalid document_type. Allowed values: ${VALID_DOCUMENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Upload document
    const document = await documentService.uploadDealDocument(
      dealId,
      file,
      documentType as DocumentType,
      user.id,
      description || undefined
    );

    return NextResponse.json(
      {
        success: true,
        data: document,
        message: 'Document uploaded successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      // File validation errors
      if (error.message.includes('size exceeds') || error.message.includes('not allowed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Deal not found or access denied
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'Deal not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to upload document' },
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
 * GET /api/deals/[id]/documents
 *
 * List all documents for a deal with signed download URLs
 *
 * Response:
 * - 200: List of documents with download URLs
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const dealId = params.id;

    // Get documents
    const documents = await documentService.getDealDocuments(dealId, user.id);

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const downloadUrl = await documentService.getDocumentDownloadUrl(doc.file_path);
        return {
          ...doc,
          download_url: downloadUrl,
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: documentsWithUrls,
        count: documentsWithUrls.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      // Deal not found or access denied
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { error: 'Deal not found or access denied' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
