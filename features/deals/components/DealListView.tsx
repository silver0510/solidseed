/**
 * DealListView Component
 * Table view for deals with sorting, filtering, and pagination
 * Mobile: Card view for screens < 768px
 */

'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, getDaysInPipeline } from '@/lib/utils/formatters';
import type { Deal, DealType } from '@/lib/types/deals';
import { exportDealsToCSV } from '../utils/exportDealsToCSV';
import { toast } from 'sonner';

interface DealListViewProps {
  deals: Deal[];
  dealTypes: DealType[];
  isLoading?: boolean;
  onStageChange?: (dealId: string, newStage: string) => Promise<void>;
  onDealClick?: (dealId: string) => void;
}

export function DealListView({
  deals,
  dealTypes,
  isLoading = false,
  onStageChange,
  onDealClick,
}: DealListViewProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [changingStage, setChangingStage] = React.useState<string | null>(null);

  // Define table columns
  const columns: ColumnDef<Deal>[] = React.useMemo(
    () => [
      {
        accessorKey: 'deal_name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3"
          >
            Deal Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <button
            onClick={() => onDealClick?.(row.original.id)}
            className="font-medium text-left hover:underline"
          >
            {row.original.deal_name}
          </button>
        ),
      },
      {
        accessorKey: 'client',
        header: 'Client',
        cell: ({ row }) => row.original.client?.name || '-',
      },
      {
        accessorKey: 'deal_type',
        header: 'Type',
        cell: ({ row }) => row.original.deal_type?.type_name || '-',
      },
      {
        accessorKey: 'current_stage',
        header: 'Stage',
        cell: ({ row }) => {
          const deal = row.original;
          const stages = deal.deal_type?.pipeline_stages || [];
          const currentStage = stages.find((s) => s.code === deal.current_stage);

          if (!onStageChange || stages.length === 0) {
            return (
              <Badge variant="outline" className="capitalize">
                {currentStage?.name || deal.current_stage}
              </Badge>
            );
          }

          return (
            <Select
              value={deal.current_stage}
              onValueChange={async (value) => {
                setChangingStage(deal.id);
                try {
                  await onStageChange(deal.id, value);
                  toast.success('Stage updated');
                } catch (error) {
                  toast.error('Failed to update stage');
                  console.error(error);
                } finally {
                  setChangingStage(null);
                }
              }}
              disabled={changingStage === deal.id}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.code} value={stage.code}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      },
      {
        accessorKey: 'deal_value',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3"
          >
            Value
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatCurrency(row.original.deal_value),
      },
      {
        accessorKey: 'expected_close_date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3"
          >
            Expected Close
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.expected_close_date),
      },
      {
        accessorKey: 'days_in_pipeline',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3"
          >
            Days in Pipeline
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const days = getDaysInPipeline(row.original.created_at);
          return <span className="text-muted-foreground">{days} days</span>;
        },
      },
    ],
    [onStageChange, onDealClick, changingStage]
  );

  const table = useReactTable({
    data: deals,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  const handleExportCSV = () => {
    try {
      exportDealsToCSV(deals);
      toast.success(`Exported ${Math.min(deals.length, 1000)} deals to CSV`);
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No deals found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {deals.length} deals
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View (visible only on mobile) */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows.map((row) => {
          const deal = row.original;
          const currentStage = deal.deal_type?.pipeline_stages.find(
            (s) => s.code === deal.current_stage
          );

          return (
            <Card
              key={deal.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onDealClick?.(deal.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{deal.deal_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {deal.client?.name || '-'}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 capitalize shrink-0">
                    {currentStage?.name || deal.current_stage}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <span>{deal.deal_type?.type_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Value:</span>{' '}
                    <span className="font-medium">{formatCurrency(deal.deal_value)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Close:</span>{' '}
                    <span>{formatDate(deal.expected_close_date)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pipeline:</span>{' '}
                    <span>{getDaysInPipeline(deal.created_at)} days</span>
                  </div>
                </div>

                {/* Stage selector for mobile */}
                {onStageChange && deal.deal_type?.pipeline_stages && (
                  <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={deal.current_stage}
                      onValueChange={async (value) => {
                        setChangingStage(deal.id);
                        try {
                          await onStageChange(deal.id, value);
                          toast.success('Stage updated');
                        } catch (error) {
                          toast.error('Failed to update stage');
                          console.error(error);
                        } finally {
                          setChangingStage(null);
                        }
                      }}
                      disabled={changingStage === deal.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deal.deal_type.pipeline_stages.map((stage) => (
                          <SelectItem key={stage.code} value={stage.code}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
