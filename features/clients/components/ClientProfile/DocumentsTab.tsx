/**
 * DocumentsTab Component
 *
 * Displays document upload and list for a client.
 *
 * @module features/clients/components/ClientProfile/DocumentsTab
 */

import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { DocumentUploadDialog } from '../DocumentUploadDialog';
import { DocumentList } from '../DocumentUploader/DocumentList';
import { documentApi } from '../../api/clientApi';
import type { ClientDocument } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the DocumentsTab component
 */
export interface DocumentsTabProps {
  /** Client ID */
  clientId: string;
  /** Array of documents to display */
  documents: ClientDocument[];
  /** Callback when a document is uploaded */
  onDocumentUploaded?: () => void;
  /** Callback when a document is deleted */
  onDocumentDeleted?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client documents tab with upload and list
 *
 * @example
 * ```tsx
 * <DocumentsTab
 *   clientId="cl123"
 *   documents={documents}
 *   onDocumentUploaded={refetchDocuments}
 * />
 * ```
 */
export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  clientId,
  documents,
  onDocumentUploaded,
  onDocumentDeleted,
  className,
}) => {
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Handle document upload completion
  const handleUpload = useCallback(
    () => {
      onDocumentUploaded?.();
      // Keep dialog open to allow multiple uploads
    },
    [onDocumentUploaded]
  );

  // Handle document download
  const handleDownload = useCallback(async (document: ClientDocument) => {
    try {
      const { url } = await documentApi.getDownloadUrl(clientId, document.id);
      // Open download URL in new tab
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to get download URL:', error);
    }
  }, [clientId]);

  // Handle document deletion
  const handleDelete = useCallback(
    async (document: ClientDocument) => {
      setDeletingDocumentId(document.id);
      try {
        await documentApi.deleteDocument(clientId, document.id);
        onDocumentDeleted?.();
      } catch (error) {
        console.error('Failed to delete document:', error);
      } finally {
        setDeletingDocumentId(null);
      }
    },
    [clientId, onDocumentDeleted]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Document Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsUploadDialogOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span>Add Document</span>
        </button>
      </div>

      {/* Document List */}
      <DocumentList
        documents={documents}
        onDownload={handleDownload}
        onDelete={handleDelete}
        isDeleting={deletingDocumentId ?? undefined}
      />

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        clientId={clientId}
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
};

export default DocumentsTab;
