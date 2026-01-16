/**
 * useDocumentUpload Hook
 *
 * Custom hook for handling document uploads with progress tracking,
 * validation, and error handling.
 *
 * @module features/clients/hooks/useDocumentUpload
 */

import { useState, useCallback } from 'react';
import { documentApi } from '../api/clientApi';
import {
  isAllowedDocumentType,
  isValidDocumentSize,
  formatFileSize,
  getFileTypeName,
} from '../helpers';
import type { ClientDocument } from '../types';
import { MAX_DOCUMENT_SIZE } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for the useDocumentUpload hook
 */
export interface UseDocumentUploadOptions {
  /** The client ID to upload documents for */
  clientId: string;
  /** Callback when upload succeeds */
  onSuccess?: (document: ClientDocument) => void;
  /** Callback when upload fails */
  onError?: (error: string) => void;
}

/**
 * State and methods returned by the useDocumentUpload hook
 */
export interface UseDocumentUploadReturn {
  /** Upload a file with optional description */
  uploadFile: (file: File, description?: string) => Promise<void>;
  /** Upload multiple files */
  uploadFiles: (files: File[], description?: string) => Promise<void>;
  /** Current upload progress (0-100) */
  uploadProgress: number;
  /** Whether an upload is in progress */
  isUploading: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Clear the error state */
  clearError: () => void;
  /** Reset all state */
  reset: () => void;
}

/**
 * File validation result
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate a file for upload
 */
function validateFile(file: File): ValidationResult {
  // Check file type
  if (!isAllowedDocumentType(file.type)) {
    const allowedTypes = ['PDF', 'DOC', 'DOCX', 'JPG', 'PNG'];
    return {
      valid: false,
      error: `File type not allowed. Supported types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check file size
  if (!isValidDocumentSize(file.size)) {
    const maxSizeFormatted = formatFileSize(MAX_DOCUMENT_SIZE);
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${maxSizeFormatted}.`,
    };
  }

  return { valid: true };
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for handling document uploads with validation and progress
 *
 * @param options - Configuration options
 * @returns Upload state and methods
 *
 * @example
 * ```tsx
 * const { uploadFile, isUploading, error, uploadProgress } = useDocumentUpload({
 *   clientId: 'client_123',
 *   onSuccess: (doc) => console.log('Uploaded:', doc),
 *   onError: (err) => console.error('Error:', err),
 * });
 *
 * const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
 *   const file = e.target.files?.[0];
 *   if (file) uploadFile(file);
 * };
 * ```
 */
export function useDocumentUpload({
  clientId,
  onSuccess,
  onError,
}: UseDocumentUploadOptions): UseDocumentUploadReturn {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear the error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setUploadProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(
    async (file: File, description?: string): Promise<void> => {
      // Clear previous error
      setError(null);

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        const errorMessage = validation.error || 'Invalid file';
        setError(errorMessage);
        onError?.(errorMessage);
        return;
      }

      setIsUploading(true);
      setUploadProgress(10); // Start progress

      try {
        // Simulate progress (real progress would come from upload event)
        setUploadProgress(30);

        const document = await documentApi.uploadDocument(clientId, file, description);

        setUploadProgress(100);
        onSuccess?.(document);
      } catch (err) {
        const errorMessage = err instanceof Error
          ? `Upload failed: ${err.message}`
          : 'Upload failed. Please try again.';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsUploading(false);
        // Reset progress after a short delay to show completion
        setTimeout(() => setUploadProgress(0), 500);
      }
    },
    [clientId, onSuccess, onError]
  );

  /**
   * Upload multiple files sequentially
   */
  const uploadFiles = useCallback(
    async (files: File[], description?: string): Promise<void> => {
      if (files.length === 0) return;

      setError(null);
      setIsUploading(true);

      const totalFiles = files.length;
      let completedFiles = 0;

      for (const file of files) {
        // Validate each file
        const validation = validateFile(file);
        if (!validation.valid) {
          const errorMessage = validation.error || 'Invalid file';
          setError(errorMessage);
          onError?.(errorMessage);
          continue; // Skip invalid files but continue with others
        }

        try {
          // Update progress based on completed files
          const progressPerFile = 100 / totalFiles;
          setUploadProgress(Math.round(completedFiles * progressPerFile + progressPerFile / 2));

          const document = await documentApi.uploadDocument(clientId, file, description);

          completedFiles++;
          setUploadProgress(Math.round(completedFiles * progressPerFile));
          onSuccess?.(document);
        } catch (err) {
          const errorMessage = err instanceof Error
            ? `Upload failed for "${file.name}": ${err.message}`
            : `Upload failed for "${file.name}". Please try again.`;
          setError(errorMessage);
          onError?.(errorMessage);
        }
      }

      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    },
    [clientId, onSuccess, onError]
  );

  return {
    uploadFile,
    uploadFiles,
    uploadProgress,
    isUploading,
    error,
    clearError,
    reset,
  };
}

export default useDocumentUpload;
