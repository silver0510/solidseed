'use client';

/**
 * DocumentUploader Component
 *
 * A drag-and-drop file uploader for client documents with validation,
 * progress tracking, and mobile-first design.
 *
 * @module features/clients/components/DocumentUploader
 */

import React, { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/auth/Button';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import { formatFileSize } from '../../helpers';
import type { ClientDocument } from '../../types';
import { MAX_DOCUMENT_SIZE } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the DocumentUploader component
 */
export interface DocumentUploaderProps {
  /** The client ID to upload documents for */
  clientId: string;
  /** Callback when a document is successfully uploaded */
  onUpload?: (document: ClientDocument) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Maximum number of files to upload at once (default: unlimited) */
  maxFiles?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * File being processed for upload
 */
interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Accept attribute value for file input
 */
const ACCEPT_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
].join(',');

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const SpinnerIcon = ({ className }: { className?: string }) => (
  <div
    className={cn('h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
    role="status"
    aria-label="Loading"
  />
);

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Document uploader with drag-and-drop support
 *
 * @example
 * ```tsx
 * <DocumentUploader
 *   clientId="client_123"
 *   onUpload={(doc) => console.log('Uploaded:', doc)}
 *   onError={(err) => console.error('Error:', err)}
 * />
 * ```
 */
export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  clientId,
  onUpload,
  onError,
  maxFiles,
  className,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadFile,
    isUploading,
    error,
    uploadProgress,
    clearError,
  } = useDocumentUpload({
    clientId,
    onSuccess: (document) => {
      onUpload?.(document);
      // Update file status to success
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'success' as const, progress: 100 } : f
        )
      );
      // Clear completed files after delay
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.status !== 'success'));
      }, 2000);
    },
    onError: (errorMsg) => {
      onError?.(errorMsg);
      // Update file status to error
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'error' as const, error: errorMsg } : f
        )
      );
    },
  });

  /**
   * Process files for upload
   */
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      let filesToUpload = fileArray;

      // Apply maxFiles limit if set
      if (maxFiles && fileArray.length > maxFiles) {
        filesToUpload = fileArray.slice(0, maxFiles);
        onError?.(`Maximum ${maxFiles} files allowed. Only first ${maxFiles} files will be uploaded.`);
      }

      // Add files to uploading state
      const newUploadingFiles: UploadingFile[] = filesToUpload.map((file) => ({
        file,
        progress: 0,
        status: 'pending' as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // Upload files sequentially
      for (const uploadingFile of newUploadingFiles) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file === uploadingFile.file ? { ...f, status: 'uploading' as const } : f
          )
        );
        await uploadFile(uploadingFile.file);
      }
    },
    [uploadFile, maxFiles, onError]
  );

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    },
    [processFiles]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes('Files')) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * Handle file drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  /**
   * Open file picker
   */
  const handleBrowseClick = useCallback(() => {
    console.log('handleBrowseClick called', fileInputRef.current);
    if (fileInputRef.current) {
      console.log('Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null');
    }
  }, []);

  /**
   * Remove file from uploading list
   */
  const removeFile = useCallback((file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
    clearError();
  }, [clearError]);

  /**
   * Get status icon for file
   */
  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'uploading':
        return <SpinnerIcon className="text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="document-upload-input"
        type="file"
        accept={ACCEPT_TYPES}
        multiple={!maxFiles || maxFiles > 1}
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload document files"
      />

      {/* Drop zone - wrapped in label for direct file input access */}
      <label
        htmlFor="document-upload-input"
        data-testid="drop-zone"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 md:p-8 transition-colors',
          'flex flex-col items-center justify-center text-center',
          'min-h-[180px] cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/10 drag-active'
            : 'border-border hover:border-muted-foreground',
          isUploading && 'pointer-events-none opacity-75'
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'rounded-full p-3',
              isDragActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Upload className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            {isDragActive ? (
              <p className="text-sm font-medium text-primary">Drop files here</p>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  Drag and drop files here
                </p>
                <p className="text-xs text-muted-foreground">
                  or{' '}
                  <span className="text-primary underline">browse files</span>
                </p>
              </>
            )}
          </div>

          <div className="text-xs text-muted-foreground/70 space-y-0.5">
            <p>Accepted: PDF, DOC, DOCX, JPG, PNG</p>
            <p>Max size: 10 MB per file</p>
          </div>
        </div>
      </label>

      {/* Upload progress and status */}
      {(isUploading || uploadProgress > 0) && (
        <div
          className="mt-4 space-y-2"
          role="status"
          aria-live="polite"
          data-testid="upload-progress"
        >
          <div className="flex items-center gap-2">
            <SpinnerIcon className="text-primary" />
            <span className="text-sm text-muted-foreground">
              Uploading... {uploadProgress}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Uploading files list */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2" role="list" aria-label="Files being uploaded">
          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={`${uploadingFile.file.name}-${index}`}
              className={cn(
                'flex items-center justify-between rounded-lg border p-3',
                uploadingFile.status === 'error' && 'border-red-200 bg-red-50',
                uploadingFile.status === 'success' && 'border-green-200 bg-green-50'
              )}
              role="listitem"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getStatusIcon(uploadingFile.status)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{uploadingFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadingFile.file.size)}
                    {uploadingFile.error && (
                      <span className="ml-2 text-destructive">{uploadingFile.error}</span>
                    )}
                  </p>
                </div>
              </div>
              {(uploadingFile.status === 'error' || uploadingFile.status === 'pending') && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uploadingFile.file);
                  }}
                  aria-label={`Remove ${uploadingFile.file.name}`}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && !uploadingFiles.some((f) => f.status === 'error') && (
        <div
          className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
