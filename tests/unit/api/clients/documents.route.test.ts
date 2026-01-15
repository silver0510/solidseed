/**
 * Unit Tests: /api/clients/:id/documents Route
 *
 * TDD Tests for document management endpoint:
 * - GET - List documents for a client
 * - POST - Upload document with multipart/form-data
 * - Error handling (validation, auth, not found)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// =============================================================================
// Mock Setup - Must be before imports
// =============================================================================

const {
  mockGetDocumentsByClient,
  mockUploadDocument,
  mockGetDownloadUrl,
} = vi.hoisted(() => {
  const mockGetDocumentsByClient = vi.fn();
  const mockUploadDocument = vi.fn();
  const mockGetDownloadUrl = vi.fn();

  return {
    mockGetDocumentsByClient,
    mockUploadDocument,
    mockGetDownloadUrl,
  };
});

vi.mock('@/services/DocumentService', () => ({
  DocumentService: class MockDocumentService {
    getDocumentsByClient = mockGetDocumentsByClient;
    uploadDocument = mockUploadDocument;
    getDownloadUrl = mockGetDownloadUrl;
  },
}));

// Import after mocks
import { GET, POST } from '@/app/api/clients/[id]/documents/route';

// =============================================================================
// Test Helpers
// =============================================================================

const TEST_CLIENT_ID = 'client_abc123';
const TEST_DOCUMENT_ID = 'doc_xyz789';

const createMockRequest = (options: {
  method?: string;
  body?: FormData | null;
} = {}): NextRequest => {
  const { method = 'GET', body = null } = options;

  const url = `http://localhost:3000/api/clients/${TEST_CLIENT_ID}/documents`;

  if (body instanceof FormData) {
    return new NextRequest(url, {
      method,
      body,
    });
  }

  return new NextRequest(url, { method });
};

const createMockParams = (id: string = TEST_CLIENT_ID) =>
  Promise.resolve({ id });

const createMockFile = (
  name: string,
  type: string,
  size: number
): File => {
  const content = new ArrayBuffer(size);
  return new File([content], name, { type });
};

// =============================================================================
// GET /api/clients/:id/documents Tests
// =============================================================================

describe('GET /api/clients/:id/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return documents for a client', async () => {
    const mockDocuments = [
      {
        id: 'doc_1',
        client_id: TEST_CLIENT_ID,
        file_name: 'contract.pdf',
        file_path: `${TEST_CLIENT_ID}/doc_1/contract.pdf`,
        file_size: 1024,
        file_type: 'application/pdf',
        uploaded_by: 'user_123',
        uploaded_at: '2026-01-15T10:00:00Z',
      },
      {
        id: 'doc_2',
        client_id: TEST_CLIENT_ID,
        file_name: 'photo.jpg',
        file_path: `${TEST_CLIENT_ID}/doc_2/photo.jpg`,
        file_size: 2048,
        file_type: 'image/jpeg',
        uploaded_by: 'user_123',
        uploaded_at: '2026-01-14T10:00:00Z',
      },
    ];

    mockGetDocumentsByClient.mockResolvedValue(mockDocuments);

    const request = createMockRequest();
    const response = await GET(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documents).toHaveLength(2);
    expect(data.documents[0].file_name).toBe('contract.pdf');
    expect(mockGetDocumentsByClient).toHaveBeenCalledWith(TEST_CLIENT_ID);
  });

  it('should return empty array when no documents exist', async () => {
    mockGetDocumentsByClient.mockResolvedValue([]);

    const request = createMockRequest();
    const response = await GET(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documents).toEqual([]);
  });

  it('should return 400 when client ID is missing', async () => {
    const request = createMockRequest();
    const response = await GET(request, { params: Promise.resolve({ id: '' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Client ID is required');
  });

  it('should return 500 on service error', async () => {
    mockGetDocumentsByClient.mockRejectedValue(new Error('Database error'));

    const request = createMockRequest();
    const response = await GET(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database error');
  });
});

// =============================================================================
// POST /api/clients/:id/documents Tests
// =============================================================================

describe('POST /api/clients/:id/documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload document successfully', async () => {
    const mockDocument = {
      id: TEST_DOCUMENT_ID,
      client_id: TEST_CLIENT_ID,
      file_name: 'contract.pdf',
      file_path: `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/contract.pdf`,
      file_size: 1024,
      file_type: 'application/pdf',
      description: 'Sales contract',
      uploaded_by: 'user_123',
      uploaded_at: '2026-01-15T10:00:00Z',
    };

    mockUploadDocument.mockResolvedValue(mockDocument);

    const formData = new FormData();
    const file = createMockFile('contract.pdf', 'application/pdf', 1024);
    formData.append('file', file);
    formData.append('description', 'Sales contract');

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.file_name).toBe('contract.pdf');
    expect(data.description).toBe('Sales contract');
    expect(mockUploadDocument).toHaveBeenCalledTimes(1);
    // Verify client ID and description were passed correctly
    const [calledClientId, , calledDescription] = mockUploadDocument.mock.calls[0];
    expect(calledClientId).toBe(TEST_CLIENT_ID);
    expect(calledDescription).toBe('Sales contract');
  });

  it('should upload document without description', async () => {
    const mockDocument = {
      id: TEST_DOCUMENT_ID,
      client_id: TEST_CLIENT_ID,
      file_name: 'photo.jpg',
      file_path: `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/photo.jpg`,
      file_size: 2048,
      file_type: 'image/jpeg',
      uploaded_by: 'user_123',
      uploaded_at: '2026-01-15T10:00:00Z',
    };

    mockUploadDocument.mockResolvedValue(mockDocument);

    const formData = new FormData();
    const file = createMockFile('photo.jpg', 'image/jpeg', 2048);
    formData.append('file', file);

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: createMockParams() });

    expect(response.status).toBe(201);
    expect(mockUploadDocument).toHaveBeenCalledTimes(1);
    // Verify client ID and description were passed correctly
    const [calledClientId, , calledDescription] = mockUploadDocument.mock.calls[0];
    expect(calledClientId).toBe(TEST_CLIENT_ID);
    expect(calledDescription).toBeUndefined();
  });

  it('should return 400 when file is missing', async () => {
    const formData = new FormData();
    formData.append('description', 'No file attached');

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('File is required');
  });

  it('should return 400 when file type is invalid', async () => {
    const formData = new FormData();
    const file = createMockFile('script.exe', 'application/x-msdownload', 1024);
    formData.append('file', file);

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File type');
  });

  it('should return 400 when file exceeds max size', async () => {
    const formData = new FormData();
    // 11MB file (max is 10MB)
    const file = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024);
    formData.append('file', file);

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File size');
  });

  it('should return 400 when client ID is missing', async () => {
    const formData = new FormData();
    const file = createMockFile('test.pdf', 'application/pdf', 1024);
    formData.append('file', file);

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: Promise.resolve({ id: '' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Client ID is required');
  });

  it('should return 401 when not authenticated', async () => {
    mockUploadDocument.mockRejectedValue(new Error('Not authenticated'));

    const formData = new FormData();
    const file = createMockFile('test.pdf', 'application/pdf', 1024);
    formData.append('file', file);

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('should return 500 on service error', async () => {
    mockUploadDocument.mockRejectedValue(new Error('Storage error'));

    const formData = new FormData();
    const file = createMockFile('test.pdf', 'application/pdf', 1024);
    formData.append('file', file);

    const request = createMockRequest({ method: 'POST', body: formData });
    const response = await POST(request, { params: createMockParams() });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Storage error');
  });
});
