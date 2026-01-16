/**
 * DocumentsTab Component
 *
 * Displays document upload and list for a client.
 *
 * @module features/clients/components/ClientProfile/DocumentsTab
 */

import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { DocumentUploader } from '../DocumentUploader';
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

  // Handle document upload completion
  const handleUpload = useCallback(
    (document: ClientDocument) => {
      onDocumentUploaded?.();
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
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <DocumentUploader
        clientId={clientId}
        onUpload={handleUpload}
      />

      {/* Document List */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Uploaded Documents
        </h3>
        <DocumentList
          documents={documents}
          onDownload={handleDownload}
          onDelete={handleDelete}
          isDeleting={deletingDocumentId ?? undefined}
        />
      </div>
    </div>
  );
};

export default DocumentsTab;
