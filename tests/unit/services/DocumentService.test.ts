/**
 * Unit Tests: DocumentService
 *
 * TDD Tests for DocumentService operations:
 * - Document upload (storage upload + DB insert)
 * - Document upload rollback on DB error
 * - Get download URL (signed URL generation)
 * - Document deletion (storage + DB)
 * - Get documents by client (list all)
 * - Error handling (auth, not found)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// =============================================================================
// Mock Setup - Must be before imports
// =============================================================================

const {
  mockSupabaseFrom,
  mockSupabaseAuth,
  mockSupabaseStorage,
  mockSupabaseClient,
} = vi.hoisted(() => {
  // Database mocks
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockOrder = vi.fn();
  const mockEq = vi.fn();

  const mockSupabaseFrom = vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    single: mockSingle,
    delete: mockDelete,
    order: mockOrder,
    eq: mockEq,
  }));

  // Auth mocks
  const mockSupabaseAuth = {
    getUser: vi.fn(),
  };

  // Storage mocks
  const mockUpload = vi.fn();
  const mockRemove = vi.fn();
  const mockCreateSignedUrl = vi.fn();

  const mockStorageFrom = vi.fn(() => ({
    upload: mockUpload,
    remove: mockRemove,
    createSignedUrl: mockCreateSignedUrl,
  }));

  const mockSupabaseStorage = {
    from: mockStorageFrom,
    _upload: mockUpload,
    _remove: mockRemove,
    _createSignedUrl: mockCreateSignedUrl,
  };

  const mockSupabaseClient = {
    from: mockSupabaseFrom,
    auth: mockSupabaseAuth,
    storage: mockSupabaseStorage,
  };

  return {
    mockSupabaseFrom,
    mockSupabaseAuth,
    mockSupabaseStorage,
    mockSupabaseClient,
    mockInsert,
    mockSelect,
    mockSingle,
    mockDelete,
    mockOrder,
    mockEq,
    mockUpload,
    mockRemove,
    mockCreateSignedUrl,
    mockStorageFrom,
  };
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Import after mock
import { DocumentService } from '@/services/DocumentService';
import type { CreateDocumentInput } from '@/lib/types/client';

// =============================================================================
// Test Data
// =============================================================================

const TEST_USER = {
  data: {
    user: {
      id: 'user_test123',
      email: 'agent@example.com',
    },
  },
};

const TEST_CLIENT_ID = 'client_abc123';
const TEST_DOCUMENT_ID = 'doc_xyz789';

const createMockFile = (
  name: string,
  type: string,
  size: number
): File => {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
};

// =============================================================================
// Tests
// =============================================================================

describe('DocumentService Foundation', () => {
  it('should instantiate successfully', () => {
    const service = new DocumentService();
    expect(service).toBeInstanceOf(DocumentService);
  });

  it('should have Supabase client initialized', () => {
    const service = new DocumentService();
    expect(service).toHaveProperty('supabase');
  });
});

describe('DocumentService.uploadDocument', () => {
  let service: DocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentService();
  });

  it('should upload document to storage and create DB record', async () => {
    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(TEST_USER);

    // Storage upload mock
    mockSupabaseStorage._upload.mockResolvedValue({
      data: { path: `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf` },
      error: null,
    });

    // Database insert mock
    const expectedDoc = {
      id: TEST_DOCUMENT_ID,
      client_id: TEST_CLIENT_ID,
      file_name: 'test.pdf',
      file_path: `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`,
      file_size: 1024,
      file_type: 'application/pdf',
      description: 'Test document',
      uploaded_by: TEST_USER.data.user.id,
      uploaded_at: '2026-01-15T10:00:00Z',
    };

    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: expectedDoc,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockDbChain),
    });

    // Create mock file
    const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);

    // Execute
    const result = await service.uploadDocument(
      TEST_CLIENT_ID,
      mockFile,
      'Test document'
    );

    // Verify
    expect(mockSupabaseAuth.getUser).toHaveBeenCalled();
    expect(mockSupabaseStorage.from).toHaveBeenCalledWith('client-documents');
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_documents');
    expect(result).toMatchObject({
      client_id: TEST_CLIENT_ID,
      file_name: 'test.pdf',
      file_type: 'application/pdf',
    });
  });

  it('should rollback storage upload on DB insert error', async () => {
    // Setup mocks
    mockSupabaseAuth.getUser.mockResolvedValue(TEST_USER);

    const filePath = `${TEST_CLIENT_ID}/doc_123/test.pdf`;

    // Storage upload succeeds
    mockSupabaseStorage._upload.mockResolvedValue({
      data: { path: filePath },
      error: null,
    });

    // Storage remove (rollback) mock
    mockSupabaseStorage._remove.mockResolvedValue({
      data: null,
      error: null,
    });

    // Database insert fails
    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      }),
    };

    mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue(mockDbChain),
    });

    // Create mock file
    const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);

    // Execute and expect error
    await expect(
      service.uploadDocument(TEST_CLIENT_ID, mockFile, 'Test')
    ).rejects.toThrow();

    // Verify rollback was called
    expect(mockSupabaseStorage._remove).toHaveBeenCalled();
  });

  it('should throw error when not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);

    await expect(
      service.uploadDocument(TEST_CLIENT_ID, mockFile)
    ).rejects.toThrow('Not authenticated');
  });

  it('should throw error when storage upload fails', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue(TEST_USER);

    mockSupabaseStorage._upload.mockResolvedValue({
      data: null,
      error: { message: 'Storage quota exceeded' },
    });

    const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);

    await expect(
      service.uploadDocument(TEST_CLIENT_ID, mockFile)
    ).rejects.toThrow('Storage quota exceeded');
  });
});

describe('DocumentService.getDownloadUrl', () => {
  let service: DocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentService();
  });

  it('should generate signed URL for document', async () => {
    const signedUrl = 'https://storage.supabase.co/signed-url-xyz';

    mockSupabaseStorage._createSignedUrl.mockResolvedValue({
      data: { signedUrl },
      error: null,
    });

    const result = await service.getDownloadUrl(
      `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`
    );

    expect(result).toBe(signedUrl);
    expect(mockSupabaseStorage.from).toHaveBeenCalledWith('client-documents');
    expect(mockSupabaseStorage._createSignedUrl).toHaveBeenCalledWith(
      `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`,
      3600 // 1 hour expiry
    );
  });

  it('should allow custom expiry time', async () => {
    const signedUrl = 'https://storage.supabase.co/signed-url-xyz';

    mockSupabaseStorage._createSignedUrl.mockResolvedValue({
      data: { signedUrl },
      error: null,
    });

    const customExpiry = 7200; // 2 hours
    await service.getDownloadUrl(
      `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`,
      customExpiry
    );

    expect(mockSupabaseStorage._createSignedUrl).toHaveBeenCalledWith(
      `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`,
      customExpiry
    );
  });

  it('should throw error when signed URL generation fails', async () => {
    mockSupabaseStorage._createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Object not found' },
    });

    await expect(
      service.getDownloadUrl(`${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`)
    ).rejects.toThrow('Object not found');
  });
});

describe('DocumentService.deleteDocument', () => {
  let service: DocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentService();
  });

  it('should delete document from storage and database', async () => {
    const filePath = `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`;

    // Storage delete mock
    mockSupabaseStorage._remove.mockResolvedValue({
      data: null,
      error: null,
    });

    // Database delete mock
    const mockDbChain = {
      eq: vi.fn().mockReturnThis(),
    };
    mockDbChain.eq.mockResolvedValue({
      data: null,
      error: null,
    });

    mockSupabaseFrom.mockReturnValue({
      delete: vi.fn().mockReturnValue(mockDbChain),
    });

    // Execute
    await service.deleteDocument(TEST_DOCUMENT_ID, filePath);

    // Verify storage deletion
    expect(mockSupabaseStorage.from).toHaveBeenCalledWith('client-documents');
    expect(mockSupabaseStorage._remove).toHaveBeenCalledWith([filePath]);

    // Verify database deletion
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_documents');
  });

  it('should throw error when storage deletion fails', async () => {
    mockSupabaseStorage._remove.mockResolvedValue({
      data: null,
      error: { message: 'Permission denied' },
    });

    await expect(
      service.deleteDocument(
        TEST_DOCUMENT_ID,
        `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`
      )
    ).rejects.toThrow('Permission denied');
  });
});

describe('DocumentService.getDocumentsByClient', () => {
  let service: DocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentService();
  });

  it('should return documents ordered by uploaded_at desc', async () => {
    const mockDocuments = [
      {
        id: 'doc_1',
        client_id: TEST_CLIENT_ID,
        file_name: 'recent.pdf',
        file_path: `${TEST_CLIENT_ID}/doc_1/recent.pdf`,
        file_size: 1024,
        file_type: 'application/pdf',
        uploaded_by: 'user_123',
        uploaded_at: '2026-01-15T12:00:00Z',
      },
      {
        id: 'doc_2',
        client_id: TEST_CLIENT_ID,
        file_name: 'older.pdf',
        file_path: `${TEST_CLIENT_ID}/doc_2/older.pdf`,
        file_size: 2048,
        file_type: 'application/pdf',
        uploaded_by: 'user_123',
        uploaded_at: '2026-01-14T10:00:00Z',
      },
    ];

    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockDocuments,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockDbChain);

    // Execute
    const result = await service.getDocumentsByClient(TEST_CLIENT_ID);

    // Verify
    expect(mockSupabaseFrom).toHaveBeenCalledWith('client_documents');
    expect(mockDbChain.select).toHaveBeenCalledWith('*');
    expect(mockDbChain.eq).toHaveBeenCalledWith('client_id', TEST_CLIENT_ID);
    expect(mockDbChain.order).toHaveBeenCalledWith('uploaded_at', {
      ascending: false,
    });
    expect(result).toHaveLength(2);
    expect(result[0].file_name).toBe('recent.pdf');
  });

  it('should return empty array when no documents exist', async () => {
    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockDbChain);

    const result = await service.getDocumentsByClient(TEST_CLIENT_ID);

    expect(result).toEqual([]);
  });

  it('should throw error when database query fails', async () => {
    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Connection error' },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockDbChain);

    await expect(
      service.getDocumentsByClient(TEST_CLIENT_ID)
    ).rejects.toThrow('Connection error');
  });
});

describe('DocumentService.getDocumentById', () => {
  let service: DocumentService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DocumentService();
  });

  it('should return document by ID', async () => {
    const mockDocument = {
      id: TEST_DOCUMENT_ID,
      client_id: TEST_CLIENT_ID,
      file_name: 'test.pdf',
      file_path: `${TEST_CLIENT_ID}/${TEST_DOCUMENT_ID}/test.pdf`,
      file_size: 1024,
      file_type: 'application/pdf',
      uploaded_by: 'user_123',
      uploaded_at: '2026-01-15T10:00:00Z',
    };

    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockDocument,
        error: null,
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockDbChain);

    const result = await service.getDocumentById(
      TEST_CLIENT_ID,
      TEST_DOCUMENT_ID
    );

    expect(mockDbChain.eq).toHaveBeenCalledWith('id', TEST_DOCUMENT_ID);
    expect(mockDbChain.eq).toHaveBeenCalledWith('client_id', TEST_CLIENT_ID);
    expect(result).toMatchObject({
      id: TEST_DOCUMENT_ID,
      file_name: 'test.pdf',
    });
  });

  it('should return null when document not found', async () => {
    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      }),
    };

    mockSupabaseFrom.mockReturnValue(mockDbChain);

    const result = await service.getDocumentById(
      TEST_CLIENT_ID,
      'nonexistent'
    );

    expect(result).toBeNull();
  });
});
