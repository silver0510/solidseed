/**
 * DocumentUploader Component Tests
 *
 * Tests for the DocumentUploader component which handles file uploads
 * with drag-drop support, validation, and progress tracking.
 *
 * @module tests/unit/features/clients/components/DocumentUploader.test
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DocumentUploader } from '@/features/clients/components/DocumentUploader';
import { DocumentList } from '@/features/clients/components/DocumentUploader/DocumentList';
import type { ClientDocument } from '@/features/clients/types';
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE,
} from '@/features/clients/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the document API
vi.mock('@/features/clients/api/clientApi', () => ({
  documentApi: {
    uploadDocument: vi.fn(),
    getDownloadUrl: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

// Import mocked API for test manipulation
import { documentApi } from '@/features/clients/api/clientApi';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockClientId = 'clxyz123456789';

const mockDocument: ClientDocument = {
  id: 'doc_123',
  client_id: mockClientId,
  file_name: 'test-document.pdf',
  file_path: 'clients/clxyz123456789/documents/test-document.pdf',
  file_size: 1024 * 100, // 100KB
  file_type: 'application/pdf',
  description: 'Test document',
  uploaded_by: 'user_123',
  uploaded_at: '2024-01-15T10:30:00Z',
};

const mockDocuments: ClientDocument[] = [
  mockDocument,
  {
    id: 'doc_456',
    client_id: mockClientId,
    file_name: 'image-photo.jpg',
    file_path: 'clients/clxyz123456789/documents/image-photo.jpg',
    file_size: 1024 * 500, // 500KB
    file_type: 'image/jpeg',
    description: 'Photo',
    uploaded_by: 'user_123',
    uploaded_at: '2024-01-14T08:00:00Z',
  },
];

/**
 * Create a mock File object for testing
 */
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const content = new Array(size).fill('a').join('');
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

// =============================================================================
// TEST SETUP
// =============================================================================

describe('DocumentUploader', () => {
  const mockOnUpload = vi.fn<(document: ClientDocument) => void>();
  const mockOnError = vi.fn<(error: string) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
    (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockResolvedValue(mockDocument);
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders drag-drop zone', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      expect(screen.getByText(/drag.*drop|drop.*files/i)).toBeInTheDocument();
    });

    it('renders file input element', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('renders upload button or clickable area', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      expect(
        screen.getByRole('button', { name: /browse|upload|select/i }) ||
        screen.getByText(/browse|click.*upload/i)
      ).toBeInTheDocument();
    });

    it('shows accepted file types hint', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      expect(screen.getByText(/pdf|doc|jpg|png/i)).toBeInTheDocument();
    });

    it('shows max file size hint', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      expect(screen.getByText(/10\s*mb|10mb/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // FILE INPUT CONFIGURATION TESTS
  // ===========================================================================

  describe('File Input Configuration', () => {
    it('accepts correct file types', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept');

      const acceptValue = fileInput.getAttribute('accept') || '';
      // Should accept PDF, DOC, DOCX, JPG, PNG
      expect(acceptValue).toMatch(/\.pdf|application\/pdf/i);
      expect(acceptValue).toMatch(/\.doc|\.docx|application\/msword|application\/vnd\.openxmlformats/i);
      expect(acceptValue).toMatch(/\.jpg|\.jpeg|image\/jpeg/i);
      expect(acceptValue).toMatch(/\.png|image\/png/i);
    });

    it('allows multiple file selection by default', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('multiple');
    });

    it('respects maxFiles prop when set to 1', () => {
      render(<DocumentUploader clientId={mockClientId} maxFiles={1} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).not.toHaveAttribute('multiple');
    });
  });

  // ===========================================================================
  // FILE TYPE VALIDATION TESTS
  // ===========================================================================

  describe('File Type Validation', () => {
    it('accepts PDF files', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalledWith(
          mockClientId,
          expect.any(File),
          undefined
        );
      });
    });

    it('accepts Word documents (.doc)', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile('document.doc', 1024, 'application/msword');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalled();
      });
    });

    it('accepts Word documents (.docx)', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile(
        'document.docx',
        1024,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalled();
      });
    });

    it('accepts JPEG images', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile('photo.jpg', 1024, 'image/jpeg');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalled();
      });
    });

    it('accepts PNG images', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile('image.png', 1024, 'image/png');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalled();
      });
    });

    it('rejects unsupported file types', async () => {
      render(<DocumentUploader clientId={mockClientId} onError={mockOnError} />);

      const file = createMockFile('script.exe', 1024, 'application/octet-stream');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Use fireEvent to bypass accept attribute filtering in userEvent
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.stringMatching(/file type not allowed|supported types/i));
      });
      expect(documentApi.uploadDocument).not.toHaveBeenCalled();
    });

    it('shows error message for invalid file type', async () => {
      render(<DocumentUploader clientId={mockClientId} />);

      const file = createMockFile('video.mp4', 1024, 'video/mp4');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Use fireEvent to bypass accept attribute filtering in userEvent
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText(/file type not allowed|supported types/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // FILE SIZE VALIDATION TESTS
  // ===========================================================================

  describe('File Size Validation', () => {
    it('accepts files under 10MB', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      // 5MB file
      const file = createMockFile('document.pdf', 5 * 1024 * 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalled();
      });
    });

    it('accepts files exactly at 10MB limit', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      // Exactly 10MB
      const file = createMockFile('document.pdf', MAX_DOCUMENT_SIZE, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalled();
      });
    });

    it('rejects files over 10MB', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onError={mockOnError} />);

      // 11MB file
      const file = createMockFile('large-document.pdf', 11 * 1024 * 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.stringMatching(/file.*too large|exceeds.*size|10.*mb/i));
      });
      expect(documentApi.uploadDocument).not.toHaveBeenCalled();
    });

    it('shows error message for oversized file', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} />);

      const file = createMockFile('huge-file.pdf', 15 * 1024 * 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/too large|maximum size/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // UPLOAD PROGRESS TESTS
  // ===========================================================================

  describe('Upload Progress', () => {
    it('shows upload progress indicator during upload', async () => {
      // Make upload take some time
      (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockDocument), 500))
      );

      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      // Should show progress indicator (could be spinner, progress bar, or text)
      await waitFor(() => {
        expect(
          screen.queryByRole('progressbar') ||
          screen.queryByText(/uploading|upload.*progress|%/i) ||
          screen.queryByTestId('upload-progress')
        ).toBeInTheDocument();
      });
    });

    it('hides progress indicator after successful upload', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalled();
      });

      // Wait for the progress reset timeout (500ms) plus extra buffer
      await waitFor(
        () => {
          // Progress should be hidden or reset
          const progressElement = screen.queryByRole('progressbar');
          const uploadingText = screen.queryByText(/^uploading\.\.\.$/i);
          expect(progressElement || uploadingText).toBeNull();
        },
        { timeout: 1000 }
      );
    });
  });

  // ===========================================================================
  // MULTIPLE FILE UPLOAD TESTS
  // ===========================================================================

  describe('Multiple File Upload', () => {
    it('handles multiple file selection', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} />);

      const files = [
        createMockFile('document1.pdf', 1024, 'application/pdf'),
        createMockFile('document2.pdf', 1024, 'application/pdf'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, files);

      await waitFor(() => {
        expect(documentApi.uploadDocument).toHaveBeenCalledTimes(2);
      });
    });

    it('shows progress for each file', async () => {
      // Make upload take some time
      (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockDocument), 200))
      );

      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} />);

      const files = [
        createMockFile('document1.pdf', 1024, 'application/pdf'),
        createMockFile('document2.pdf', 1024, 'application/pdf'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, files);

      // Should show file names or count during upload
      await waitFor(() => {
        expect(
          screen.queryByText(/document1\.pdf/i) ||
          screen.queryByText(/document2\.pdf/i) ||
          screen.queryByText(/2.*files|uploading/i)
        ).toBeInTheDocument();
      });
    });

    it('respects maxFiles limit', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} maxFiles={2} onError={mockOnError} />);

      const files = [
        createMockFile('document1.pdf', 1024, 'application/pdf'),
        createMockFile('document2.pdf', 1024, 'application/pdf'),
        createMockFile('document3.pdf', 1024, 'application/pdf'),
      ];
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, files);

      // Should only upload 2 files or show error
      await waitFor(() => {
        expect(
          (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mock.calls.length <= 2 ||
          mockOnError.mock.calls.length > 0
        ).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // CALLBACK TESTS
  // ===========================================================================

  describe('Callbacks', () => {
    it('calls onUpload callback on successful upload', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(mockDocument);
      });
    });

    it('calls onError callback when upload fails', async () => {
      (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Upload failed')
      );

      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onError={mockOnError} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.stringMatching(/failed|error/i));
      });
    });
  });

  // ===========================================================================
  // DRAG AND DROP TESTS
  // ===========================================================================

  describe('Drag and Drop', () => {
    it('shows visual feedback on drag over', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      const dropZone = screen.getByTestId('drop-zone') ||
        screen.getByText(/drag.*drop/i).closest('div');

      if (dropZone) {
        fireEvent.dragEnter(dropZone, {
          dataTransfer: { types: ['Files'] },
        });

        // Should have visual change (class, style, or text change)
        expect(
          dropZone.className.includes('drag') ||
          dropZone.className.includes('active') ||
          dropZone.className.includes('over') ||
          screen.queryByText(/drop.*here|release/i)
        ).toBeTruthy();
      }
    });

    it('handles file drop', async () => {
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const dropZone = screen.getByTestId('drop-zone') ||
        screen.getByText(/drag.*drop/i).closest('div');

      if (dropZone) {
        const file = createMockFile('document.pdf', 1024, 'application/pdf');

        fireEvent.drop(dropZone, {
          dataTransfer: {
            files: [file],
            types: ['Files'],
          },
        });

        await waitFor(() => {
          expect(documentApi.uploadDocument).toHaveBeenCalled();
        });
      }
    });
  });

  // ===========================================================================
  // ERROR STATE TESTS
  // ===========================================================================

  describe('Error States', () => {
    it('displays error message when upload fails', async () => {
      (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      (documentApi.uploadDocument as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockDocument);

      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} onUpload={mockOnUpload} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // First upload fails
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
      });

      // Retry
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(mockDocument);
      });
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible file input with label', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('aria-label');
    });

    it('announces upload status to screen readers', async () => {
      const user = userEvent.setup();
      render(<DocumentUploader clientId={mockClientId} />);

      const file = createMockFile('document.pdf', 1024, 'application/pdf');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(fileInput, file);

      await waitFor(() => {
        // Should have aria-live region or status announcement
        expect(
          document.querySelector('[aria-live]') ||
          document.querySelector('[role="status"]') ||
          document.querySelector('[role="alert"]')
        ).toBeInTheDocument();
      });
    });

    it('provides keyboard navigation', () => {
      render(<DocumentUploader clientId={mockClientId} />);

      // The drop zone or button should be focusable
      const focusableElements = document.querySelectorAll(
        'button, [tabindex="0"], [role="button"]'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // CUSTOM CLASS NAME TEST
  // ===========================================================================

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<DocumentUploader clientId={mockClientId} className="custom-class" />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });
});

// =============================================================================
// DOCUMENT LIST COMPONENT TESTS
// =============================================================================

describe('DocumentList', () => {
  const mockOnDownload = vi.fn<(document: ClientDocument) => void>();
  const mockOnDelete = vi.fn<(document: ClientDocument) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders list of documents', () => {
      render(<DocumentList documents={mockDocuments} />);

      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image-photo.jpg')).toBeInTheDocument();
    });

    it('shows empty state when no documents', () => {
      render(<DocumentList documents={[]} />);

      expect(screen.getByText(/no documents|empty/i)).toBeInTheDocument();
    });

    it('displays file size', () => {
      render(<DocumentList documents={mockDocuments} />);

      // 100KB should be displayed
      expect(screen.getByText(/100.*kb|0\.1.*mb/i)).toBeInTheDocument();
    });

    it('displays file type icon or badge', () => {
      render(<DocumentList documents={mockDocuments} />);

      // Should show PDF badge for the first document
      const pdfBadge = screen.queryByText('PDF');
      const pdfDataType = document.querySelector('[data-file-type="pdf"]');
      expect(pdfBadge || pdfDataType).toBeTruthy();
    });

    it('displays upload date', () => {
      render(<DocumentList documents={mockDocuments} />);

      // Should show formatted dates - we have two documents with dates Jan 15 and Jan 14
      const dateElements = screen.getAllByText(/jan.*\d+.*2024/i);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // ACTION TESTS
  // ===========================================================================

  describe('Actions', () => {
    it('shows download button for each document', () => {
      render(<DocumentList documents={mockDocuments} onDownload={mockOnDownload} />);

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      expect(downloadButtons).toHaveLength(2);
    });

    it('calls onDownload when download button is clicked', async () => {
      const user = userEvent.setup();
      render(<DocumentList documents={mockDocuments} onDownload={mockOnDownload} />);

      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      await user.click(downloadButtons[0]);

      expect(mockOnDownload).toHaveBeenCalledWith(mockDocuments[0]);
    });

    it('shows delete button when onDelete is provided', () => {
      render(<DocumentList documents={mockDocuments} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove/i });
      expect(deleteButtons).toHaveLength(2);
    });

    it('does not show delete button when onDelete is not provided', () => {
      render(<DocumentList documents={mockDocuments} />);

      expect(screen.queryByRole('button', { name: /delete|remove/i })).not.toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<DocumentList documents={mockDocuments} onDelete={mockOnDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove/i });
      await user.click(deleteButtons[0]);

      expect(mockOnDelete).toHaveBeenCalledWith(mockDocuments[0]);
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading state when isDeleting matches document id', () => {
      render(
        <DocumentList
          documents={mockDocuments}
          onDelete={mockOnDelete}
          isDeleting="doc_123"
        />
      );

      // The delete button for doc_123 should be disabled or show loading
      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove|deleting/i });
      expect(deleteButtons[0]).toBeDisabled();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('uses semantic list structure', () => {
      render(<DocumentList documents={mockDocuments} />);

      expect(
        document.querySelector('ul') ||
        document.querySelector('[role="list"]')
      ).toBeInTheDocument();
    });

    it('has accessible button labels', () => {
      render(
        <DocumentList
          documents={mockDocuments}
          onDownload={mockOnDownload}
          onDelete={mockOnDelete}
        />
      );

      // Buttons should have accessible names
      const downloadButtons = screen.getAllByRole('button', { name: /download/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete|remove/i });

      expect(downloadButtons[0]).toHaveAccessibleName();
      expect(deleteButtons[0]).toHaveAccessibleName();
    });
  });
});
