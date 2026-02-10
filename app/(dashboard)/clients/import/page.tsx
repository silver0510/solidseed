'use client';

/**
 * Client Import Review Page
 *
 * Displays parsed CSV data in an editable table for review before importing.
 * Reads data from sessionStorage (set by CSVUploadDialog).
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { ImportReviewTable } from '@/features/clients/components/ImportReviewTable';
import { clientApi, clientQueryKeys } from '@/features/clients/api/clientApi';
import { validateAllRows } from '@/features/clients/utils/csvValidation';
import { formatPhoneNumber } from '@/features/clients/helpers';
import type {
  ImportRow,
  ImportRowData,
  CSVImportResult,
} from '@/features/clients/types';

export default function ClientImportPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [resultDialog, setResultDialog] = useState<CSVImportResult | null>(
    null
  );

  // Load data from sessionStorage on mount
  useEffect(() => {
    const data = sessionStorage.getItem('csv-import-data');
    if (!data) {
      router.replace('/clients');
      return;
    }

    try {
      const parsed: ImportRowData[] = JSON.parse(data);
      const validated = validateAllRows(parsed);
      setRows(validated);
      setIsLoaded(true);
    } catch {
      router.replace('/clients');
    }
  }, [router]);

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      // Collect only valid rows
      const validRows = rows.filter((r) => r.isValid);

      // Transform rows to API format
      const clients = validRows.map((row) => {
        const client: Record<string, unknown> = {
          name: row.data.name.trim(),
          email: row.data.email.trim().toLowerCase(),
        };

        // Phone: format if provided
        if (row.data.phone.trim()) {
          client.phone = formatPhoneNumber(row.data.phone.trim());
        }

        // Birthday
        if (row.data.birthday.trim()) {
          client.birthday = row.data.birthday.trim();
        }

        // Address
        if (row.data.address.trim()) {
          client.address = row.data.address.trim();
        }

        // Tags: split comma-separated string into array
        if (row.data.tags.trim()) {
          client.tags = row.data.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        }

        return client as {
          name: string;
          email: string;
          phone?: string;
          birthday?: string;
          address?: string;
          tags?: string[];
        };
      });

      return clientApi.importClients({ clients });
    },
    onSuccess: (result) => {
      setResultDialog(result);
      // Clear sessionStorage
      sessionStorage.removeItem('csv-import-data');
      sessionStorage.removeItem('csv-import-warnings');
      // Invalidate client queries
      queryClient.invalidateQueries({ queryKey: clientQueryKeys.all });
    },
  });

  const handleImport = useCallback(() => {
    importMutation.mutate();
  }, [importMutation]);

  const handleBackToClients = useCallback(() => {
    sessionStorage.removeItem('csv-import-data');
    sessionStorage.removeItem('csv-import-warnings');
    router.push('/clients');
  }, [router]);

  const handleResultClose = useCallback(() => {
    setResultDialog(null);
    router.push('/clients');
  }, [router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToClients}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Import Clients</h1>
            <p className="text-sm text-muted-foreground">
              Review and edit your data before importing.
            </p>
          </div>
        </div>
      </div>

      {/* Import error */}
      {importMutation.isError && (
        <div
          className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm">
              {importMutation.error instanceof Error
                ? importMutation.error.message
                : 'Import failed. Please try again.'}
            </span>
          </div>
        </div>
      )}

      {/* Review Table */}
      <ImportReviewTable
        rows={rows}
        onRowsChange={setRows}
        onImport={handleImport}
        isImporting={importMutation.isPending}
      />

      {/* Cancel button */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={handleBackToClients}>
          Cancel
        </Button>
      </div>

      {/* Result Dialog */}
      <Dialog
        open={resultDialog !== null}
        onOpenChange={(open) => {
          if (!open) handleResultClose();
        }}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Import Complete</DialogTitle>
            <DialogDescription>
              Here&apos;s a summary of the import results.
            </DialogDescription>
          </DialogHeader>
          {resultDialog && (
            <div className="space-y-4">
              {/* Success count */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {resultDialog.imported} client
                    {resultDialog.imported !== 1 ? 's' : ''} imported
                    successfully
                  </p>
                </div>
              </div>

              {/* Failed count */}
              {resultDialog.failed > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {resultDialog.failed} client
                        {resultDialog.failed !== 1 ? 's' : ''} failed to import
                      </p>
                    </div>
                  </div>

                  {/* Error details */}
                  <div className="max-h-40 overflow-y-auto rounded border bg-muted/50 p-2 space-y-1">
                    {resultDialog.errors.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleResultClose}>Go to Clients</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
