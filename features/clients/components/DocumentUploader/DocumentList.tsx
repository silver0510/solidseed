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
// ICONS (inline SVG to avoid external dependencies)
// =============================================================================

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const FileImageIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <circle cx="10" cy="13" r="2" />
    <path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22" />
  </svg>
);

const FileIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

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

const FolderOpenIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
  </svg>
);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get icon component based on file type
 */
function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) {
    return FileImageIcon;
  }
  if (fileType === 'application/pdf') {
    return FileTextIcon;
  }
  return FileIcon;
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
          <FolderOpenIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
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
                      <FileIconComponent className="text-muted-foreground h-5 w-5" />
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
                        <DownloadIcon />
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
                        {isCurrentlyDeleting ? <SpinnerIcon /> : <TrashIcon />}
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
