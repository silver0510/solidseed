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
import { Upload, FileText, Download, Trash2 } from 'lucide-react';
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
              <Upload className="h-12 w-12" strokeWidth={1.5} />
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
                        <FileText className="h-5 w-5 text-primary" strokeWidth={1.5} />
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
                        <Download className="h-4 w-4" strokeWidth={1.5} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(document.id)}
                        disabled={deleteDocument.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" strokeWidth={1.5} />
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
              <FileText className="h-12 w-12" strokeWidth={1.5} />
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
