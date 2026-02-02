/**
 * DocumentList Component
 *
 * Displays a list of documents with download and delete actions.
 * Shows file information including name, size, type, and upload date.
 *
 * @module features/clients/components/DocumentUploader/DocumentList
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { FileText, FileImage, File, Download, Trash2, FolderOpen } from 'lucide-react';
import { formatFileSize, formatDateTime } from '../../helpers';
import type { ClientDocument } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the DocumentList component
 */
export interface DocumentListProps {
  /** Array of documents to display */
  documents: ClientDocument[];
  /** Callback when download button is clicked */
  onDownload?: (document: ClientDocument) => void;
  /** Callback when delete button is clicked */
  onDelete?: (document: ClientDocument) => void;
  /** Document ID currently being deleted (shows loading state) */
  isDeleting?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const SpinnerIcon = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
      className
    )}
    role="status"
    aria-label="Loading"
  />
);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get icon component based on file type
 */
function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return FileImage;
  }
  if (fileType === 'application/pdf') {
    return FileText;
  }
  return File;
}

/**
 * Get file type badge color
 */
function getFileTypeBadgeClass(fileType: string): string {
  if (fileType === 'application/pdf') {
    return 'bg-red-100 text-red-700';
  }
  if (fileType.startsWith('image/')) {
    return 'bg-blue-100 text-blue-700';
  }
  if (fileType.includes('word') || fileType.includes('document')) {
    return 'bg-indigo-100 text-indigo-700';
  }
  return 'bg-gray-100 text-gray-700';
}

/**
 * Get short file type label
 */
function getFileTypeLabel(fileType: string): string {
  if (fileType === 'application/pdf') return 'PDF';
  if (fileType === 'image/jpeg') return 'JPG';
  if (fileType === 'image/png') return 'PNG';
  if (fileType === 'application/msword') return 'DOC';
  if (fileType.includes('openxmlformats') && fileType.includes('word')) return 'DOCX';
  return 'FILE';
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Document list with download and delete actions
 *
 * @example
 * ```tsx
 * <DocumentList
 *   documents={documents}
 *   onDownload={(doc) => downloadDocument(doc)}
 *   onDelete={(doc) => deleteDocument(doc)}
 *   isDeleting={deletingDocId}
 * />
 * ```
 */
export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDownload,
  onDelete,
  isDeleting,
  className,
}) => {
  // Empty state
  if (documents.length === 0) {
    return (
      <div className={cn('w-full rounded-lg border border-border bg-card p-8', className)}>
        <div className="flex flex-col items-center justify-center py-4">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Uploaded
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
          {documents.map((document) => {
            const FileIconComponent = getFileIcon(document.file_type);
            const isCurrentlyDeleting = isDeleting === document.id;

            return (
              <tr
                key={document.id}
                className={cn(
                  'transition-colors hover:bg-muted/30',
                  isCurrentlyDeleting && 'opacity-50'
                )}
                data-file-type={getFileTypeLabel(document.file_type).toLowerCase()}
              >
                {/* File name with icon */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="shrink-0">
                      <FileIconComponent className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {document.file_name}
                      </p>
                      {document.description && (
                        <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* File type */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex px-2 py-1 text-xs font-medium rounded',
                      getFileTypeBadgeClass(document.file_type)
                    )}
                  >
                    {getFileTypeLabel(document.file_type)}
                  </span>
                </td>

                {/* File size */}
                <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                  {formatFileSize(document.file_size)}
                </td>

                {/* Upload date */}
                <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                  {formatDateTime(document.uploaded_at)}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {onDownload && (
                      <button
                        type="button"
                        onClick={() => onDownload(document)}
                        aria-label={`Download ${document.file_name}`}
                        className="p-1.5 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(document)}
                        disabled={isCurrentlyDeleting}
                        aria-label={
                          isCurrentlyDeleting
                            ? `Deleting ${document.file_name}`
                            : `Delete ${document.file_name}`
                        }
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          isCurrentlyDeleting
                            ? 'text-muted-foreground cursor-not-allowed'
                            : 'text-destructive/70 hover:text-destructive hover:bg-destructive/10'
                        )}
                      >
                        {isCurrentlyDeleting ? <SpinnerIcon /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentList;
