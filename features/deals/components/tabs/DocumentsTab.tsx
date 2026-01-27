/**
 * DocumentsTab Component
 *
 * Displays:
 * - Document upload component (drag-and-drop)
 * - Document list with download links
 * - Document type badges
 * - Delete confirmation
 * - File size validation (25MB max)
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDealMutations } from '../../hooks/useDealMutations';
import type { DealWithRelations, DealDocument } from '../../types';

export interface DocumentsTabProps {
  deal: DealWithRelations;
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_FILE_EXTENSIONS = 'PDF, JPEG, PNG, DOC, DOCX, XLS, XLSX';

const DOCUMENT_TYPES = [
  { label: 'Contract', value: 'contract' },
  { label: 'Disclosure', value: 'disclosure' },
  { label: 'Inspection Report', value: 'inspection_report' },
  { label: 'Appraisal', value: 'appraisal' },
  { label: 'Closing Statement', value: 'closing_statement' },
  { label: 'Other', value: 'other' },
] as const;

export function DocumentsTab({ deal }: DocumentsTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('contract');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const { uploadDocument, deleteDocument } = useDealMutations(deal.id);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setUploadError(null);

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size exceeds 25MB limit');
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(`File type not allowed. Allowed types: ${ALLOWED_FILE_EXTENSIONS}`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadError(null); // Clear any previous errors

      await uploadDocument.mutateAsync({
        file: selectedFile,
        document_type: documentType,
      });
      setSelectedFile(null);
      setDocumentType('contract');
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload document');
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setUploadError(null); // Clear error when canceling
  };

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    await deleteDocument.mutateAsync(documentToDelete);
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const handleDownload = (document: DealDocument) => {
    // Trigger download
    window.open(`/api/deals/${deal.id}/documents/${document.id}/download`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDocumentType = (type: string) => {
    const documentType = DOCUMENT_TYPES.find(t => t.value === type);
    return documentType?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto h-12 w-12 mb-4 text-muted-foreground">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>

            {selectedFile ? (
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>

                <div className="flex items-center gap-4 justify-center">
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleUpload}
                    disabled={uploadDocument.isPending}
                    className="min-w-[100px]"
                  >
                    {uploadDocument.isPending ? 'Uploading...' : 'Upload'}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleCancelUpload}
                    disabled={uploadDocument.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Drag and drop a file here, or click to browse</p>
                <p className="text-xs text-muted-foreground">Maximum file size: 25MB</p>
                <p className="text-xs text-muted-foreground">Allowed types: {ALLOWED_FILE_EXTENSIONS}</p>
                <input
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                  accept={ALLOWED_FILE_TYPES.join(',')}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="mt-2"
                >
                  Browse Files
                </Button>
              </div>
            )}

            {uploadError && (
              <p className="text-sm text-destructive mt-2">{uploadError}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      {deal.documents && deal.documents.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-medium">Documents ({deal.documents.length})</h3>
          <div className="space-y-2">
            {deal.documents.map((document) => (
              <Card key={document.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <svg
                          className="h-5 w-5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{document.file_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary">{formatDocumentType(document.document_type)}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(document.file_size)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(document.uploaded_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                          />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(document.id)}
                        disabled={deleteDocument.isPending}
                      >
                        <svg
                          className="h-4 w-4 text-destructive"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="mx-auto h-12 w-12 mb-4 text-muted-foreground/40">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <p className="font-medium">No documents uploaded</p>
            <p className="text-sm mt-1">Upload documents to keep all deal files organized</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocument.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDocument.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocument.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
