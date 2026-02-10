'use client';

/**
 * CSV Upload Dialog Component
 *
 * Displays a drag-and-drop CSV upload interface styled after DocumentUploadDialog.
 * Parses CSV, stores data in sessionStorage, and navigates to the import review page.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, Download } from 'lucide-react';
import { parseCSVFile, downloadCSVTemplate } from '../../utils/csvTemplate';

// =============================================================================
// TYPES
// =============================================================================

export interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const CSVUploadDialog: React.FC<CSVUploadDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsParsing(true);

      try {
        const { rows, warnings } = await parseCSVFile(file);

        // Store parsed data in sessionStorage for the import review page
        sessionStorage.setItem('csv-import-data', JSON.stringify(rows));

        if (warnings.length > 0) {
          sessionStorage.setItem(
            'csv-import-warnings',
            JSON.stringify(warnings)
          );
        }

        // Navigate to import review page
        onOpenChange(false);
        router.push('/clients/import');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to parse CSV file'
        );
      } finally {
        setIsParsing(false);
      }
    },
    [router, onOpenChange]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input so same file can be selected again
      event.target.value = '';
    },
    [handleFile]
  );

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

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDownloadTemplate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      downloadCSVTemplate();
    },
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-125"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg">Import Clients</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple clients at once.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload CSV file"
          />

          {/* Drop zone */}
          <label
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              'relative rounded-lg border-2 border-dashed p-6 md:p-8 transition-colors',
              'flex flex-col items-center justify-center text-center',
              'min-h-[180px] cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-muted-foreground',
              isParsing && 'pointer-events-none opacity-75'
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBrowseClick();
              }
            }}
            onClick={handleBrowseClick}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className={cn(
                  'rounded-full p-3',
                  isDragActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isParsing ? (
                  <div
                    className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
                    role="status"
                    aria-label="Processing"
                  />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>

              <div className="space-y-1">
                {isParsing ? (
                  <p className="text-sm font-medium text-foreground">
                    Processing CSV file...
                  </p>
                ) : isDragActive ? (
                  <p className="text-sm font-medium text-primary">
                    Drop CSV file here
                  </p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Drag and drop your CSV file here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or{' '}
                      <span className="text-primary underline">
                        browse files
                      </span>
                    </p>
                  </>
                )}
              </div>

              <div className="text-xs text-muted-foreground/70 space-y-0.5">
                <p>Accepted: CSV files (.csv)</p>
                <p>Max: 500 rows per import</p>
              </div>
            </div>
          </label>

          {/* Error message */}
          {error && (
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

          {/* Download template link */}
          <div className="mt-4 flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-muted-foreground hover:text-foreground"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download CSV Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVUploadDialog;
