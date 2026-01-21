'use client';

/**
 * Document Upload Dialog Component
 *
 * Displays document upload interface in a popup dialog.
 * Wraps the DocumentUploader component for consistent UX with notes and tasks.
 */

import { useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DocumentUploader } from '../DocumentUploader';
import type { ClientDocument } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface DocumentUploadDialogProps {
  /** Client ID for document upload */
  clientId: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when a document is successfully uploaded */
  onUpload?: (document: ClientDocument) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  clientId,
  open,
  onOpenChange,
  onUpload,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle successful upload
  const handleUpload = (document: ClientDocument) => {
    onUpload?.(document);
    // Close dialog after a brief delay to show success state
    setTimeout(() => {
      onOpenChange(false);
    }, 1500); // 1.5 seconds to see the success state
  };

  // Trigger file input click
  const handleBrowseClick = useCallback(() => {
    // Use a slight delay to ensure the click is user-initiated
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-125"
        onPointerDownOutside={(e) => {
          // Allow interactions with file picker
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent dialog from closing when file picker opens
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Upload Document</DialogTitle>
          <DialogDescription>
            Upload documents for this client. You can upload multiple files.
          </DialogDescription>
        </DialogHeader>

        {/* Make file input accessible at dialog level to avoid portal issues */}
        <div>
          <DocumentUploader
            clientId={clientId}
            onUpload={handleUpload}
            onError={onError}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;
