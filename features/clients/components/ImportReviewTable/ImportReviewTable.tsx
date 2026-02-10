'use client';

/**
 * Import Review Table Component
 *
 * Editable table for reviewing and validating CSV import data.
 * Supports inline editing, validation highlighting, filter tabs, and bulk actions.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertCircle,
  Trash2Icon,
  PlusIcon,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImportRow, ImportRowData, ImportFilterTab } from '../../types';
import {
  revalidateRow,
  createEmptyRow,
} from '../../utils/csvValidation';
import { downloadCSVTemplate } from '../../utils/csvTemplate';

// =============================================================================
// TYPES
// =============================================================================

export interface ImportReviewTableProps {
  rows: ImportRow[];
  onRowsChange: (rows: ImportRow[]) => void;
  onImport: () => void;
  isImporting: boolean;
}

// =============================================================================
// EDITABLE CELL
// =============================================================================

interface EditableCellProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  error,
  onChange,
  placeholder,
  type = 'text',
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="space-y-0.5">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsEditing(false);
            if (e.key === 'Escape') setIsEditing(false);
          }}
          autoFocus
          className={cn(
            'h-8 text-sm',
            error && 'border-destructive focus-visible:ring-destructive'
          )}
          placeholder={placeholder}
        />
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-[32px] flex items-center px-2 py-1 rounded cursor-pointer text-sm',
        'hover:bg-muted/50 transition-colors',
        error && 'bg-destructive/10 text-destructive'
      )}
      onClick={() => setIsEditing(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      {value || (
        <span className="text-muted-foreground">{placeholder || '—'}</span>
      )}
      {error && !isEditing && (
        <div className="ml-1">
          <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
        </div>
      )}
    </div>
  );
};

// =============================================================================
// COMPONENT
// =============================================================================

export const ImportReviewTable: React.FC<ImportReviewTableProps> = ({
  rows,
  onRowsChange,
  onImport,
  isImporting,
}) => {
  const [activeFilter, setActiveFilter] = useState<ImportFilterTab>('all');

  // Counts
  const validCount = useMemo(
    () => rows.filter((r) => r.isValid).length,
    [rows]
  );
  const errorCount = useMemo(
    () => rows.filter((r) => !r.isValid).length,
    [rows]
  );

  // Filtered rows
  const filteredRows = useMemo(() => {
    switch (activeFilter) {
      case 'valid':
        return rows.filter((r) => r.isValid);
      case 'error':
        return rows.filter((r) => !r.isValid);
      default:
        return rows;
    }
  }, [rows, activeFilter]);

  // Cell edit handler
  const handleCellChange = useCallback(
    (rowId: string, field: keyof ImportRowData, value: string) => {
      const newRows = rows.map((row) => {
        if (row.id !== rowId) return row;

        const updatedRow: ImportRow = {
          ...row,
          data: { ...row.data, [field]: value },
        };

        // Re-validate this row
        return revalidateRow(updatedRow, rows);
      });

      onRowsChange(newRows);
    },
    [rows, onRowsChange]
  );

  // Delete row handler
  const handleDeleteRow = useCallback(
    (rowId: string) => {
      const newRows = rows
        .filter((r) => r.id !== rowId)
        .map((row, index) => ({ ...row, rowIndex: index }));
      onRowsChange(newRows);
    },
    [rows, onRowsChange]
  );

  // Add empty row
  const handleAddRow = useCallback(() => {
    const newRow = createEmptyRow(rows.length);
    onRowsChange([...rows, newRow]);
  }, [rows, onRowsChange]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <Tabs
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as ImportFilterTab)}
        >
          <TabsList>
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All Leads ({rows.length})
            </TabsTrigger>
            <TabsTrigger value="valid" className="text-xs sm:text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" />
              Valid ({validCount})
            </TabsTrigger>
            <TabsTrigger value="error" className="text-xs sm:text-sm">
              <AlertCircle className="h-3.5 w-3.5 mr-1 text-destructive" />
              Errors ({errorCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCSVTemplate}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Template
          </Button>
          <Button
            size="sm"
            onClick={onImport}
            disabled={isImporting || validCount === 0}
          >
            {isImporting ? 'Importing...' : `Add ${validCount} Client${validCount !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead className="min-w-[140px]">
                Name<span className="text-destructive">*</span>
              </TableHead>
              <TableHead className="min-w-[180px]">
                Email<span className="text-destructive">*</span>
              </TableHead>
              <TableHead className="min-w-[130px]">Phone</TableHead>
              <TableHead className="min-w-[120px]">Birthday</TableHead>
              <TableHead className="min-w-[160px]">Address</TableHead>
              <TableHead className="min-w-[120px]">Tags</TableHead>
              <TableHead className="w-16 text-center">Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  {activeFilter === 'valid'
                    ? 'No valid leads found. Fix errors to see valid leads here.'
                    : activeFilter === 'error'
                      ? 'No errors found. All leads are valid!'
                      : 'No leads to display. Add leads using the button below.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    'transition-colors',
                    !row.isValid && 'bg-destructive/5'
                  )}
                >
                  {/* Row number */}
                  <TableCell className="text-center text-sm text-muted-foreground font-mono">
                    {row.rowIndex + 1}
                  </TableCell>

                  {/* Name */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.data.name}
                      error={row.errors.name}
                      onChange={(v) => handleCellChange(row.id, 'name', v)}
                      placeholder="Full Name"
                    />
                  </TableCell>

                  {/* Email */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.data.email}
                      error={row.errors.email}
                      onChange={(v) => handleCellChange(row.id, 'email', v)}
                      placeholder="email@example.com"
                      type="email"
                    />
                  </TableCell>

                  {/* Phone */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.data.phone}
                      error={row.errors.phone}
                      onChange={(v) => handleCellChange(row.id, 'phone', v)}
                      placeholder="5551234567"
                    />
                  </TableCell>

                  {/* Birthday */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.data.birthday}
                      error={row.errors.birthday}
                      onChange={(v) =>
                        handleCellChange(row.id, 'birthday', v)
                      }
                      placeholder="YYYY-MM-DD"
                    />
                  </TableCell>

                  {/* Address */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.data.address}
                      error={row.errors.address}
                      onChange={(v) =>
                        handleCellChange(row.id, 'address', v)
                      }
                      placeholder="Address"
                    />
                  </TableCell>

                  {/* Tags */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.data.tags}
                      error={row.errors.tags}
                      onChange={(v) => handleCellChange(row.id, 'tags', v)}
                      placeholder="Tag1, Tag2"
                    />
                  </TableCell>

                  {/* Status icon */}
                  <TableCell className="text-center">
                    {row.isValid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                    )}
                  </TableCell>

                  {/* Delete */}
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add row button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        className="w-full border-dashed"
      >
        <PlusIcon className="h-4 w-4 mr-1.5" />
        Add Lead
      </Button>
    </div>
  );
};

export default ImportReviewTable;
