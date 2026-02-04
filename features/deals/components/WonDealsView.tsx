/**
 * WonDealsView Component
 * Table view for won deals with sorting and pagination
 * Shows deals with status = 'closed_won'
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Download, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { Deal } from '@/lib/types/deals';
import { exportDealsToCSV } from '../utils/exportDealsToCSV';
import { toast } from 'sonner';

interface WonDealsViewProps {
  dealTypeId?: string;
}

export function WonDealsView({ dealTypeId }: WonDealsViewProps) {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Fetch won deals from API
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals', 'won', dealTypeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'closed_won',
        ...(dealTypeId && { deal_type_id: dealTypeId }),
        limit: '1000',
      });

      const response = await fetch(`/api/deals?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch won deals');
      }

      const result = await response.json();
      return result.data?.deals || [];
    },
  });

  // Handle deal click - navigate to deal detail
  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  // Get sort icon for column
  const getSortIcon = (columnKey: string) => {
    const column = table.getColumn(columnKey);
    if (!column) return <ArrowUpDownIcon className="h-3.5 w-3.5 opacity-40" />;

    const sortDirection = column.getIsSorted();
    if (!sortDirection) {
      return <ArrowUpDownIcon className="h-3.5 w-3.5 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUpIcon className="h-3.5 w-3.5" />;
    }
    return <ArrowDownIcon className="h-3.5 w-3.5" />;
  };

  // Define table columns
  const columns: ColumnDef<Deal>[] = React.useMemo(
    () => [
      {
        accessorKey: 'deal_name',
        header: 'Deal Name',
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.deal_name}
          </span>
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
        header: 'Final Stage',
        cell: ({ row }) => {
          const deal = row.original;
          const stages = deal.deal_type?.pipeline_stages || [];
          const currentStage = stages.find((s) => s.code === deal.current_stage);

          return (
            <Badge variant="outline" className="capitalize">
              {currentStage?.name || deal.current_stage}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'deal_value',
        header: 'Value',
        cell: ({ row }) => formatCurrency(row.original.deal_value),
      },
      {
        accessorKey: 'agent_commission',
        header: 'Commission',
        cell: ({ row }) => formatCurrency(row.original.agent_commission),
      },
      {
        accessorKey: 'closed_at',
        header: 'Won Date',
        cell: ({ row }) => formatDate(row.original.closed_at),
      },
    ],
    []
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
      toast.success(`Exported ${Math.min(deals.length, 1000)} won deals to CSV`);
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading won deals...
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No won deals found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {deals.length} won deals
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left w-auto">
                  <button
                    onClick={() => table.getColumn('deal_name')?.toggleSorting()}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                      table.getColumn('deal_name')?.getIsSorted() ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Deal Name
                    {getSortIcon('deal_name')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left w-40">
                  <button
                    onClick={() => table.getColumn('client')?.toggleSorting()}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                      table.getColumn('client')?.getIsSorted() ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Client
                    {getSortIcon('client')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </span>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Final Stage
                  </span>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <button
                    onClick={() => table.getColumn('deal_value')?.toggleSorting()}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                      table.getColumn('deal_value')?.getIsSorted() ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Value
                    {getSortIcon('deal_value')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <button
                    onClick={() => table.getColumn('agent_commission')?.toggleSorting()}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                      table.getColumn('agent_commission')?.getIsSorted() ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Commission
                    {getSortIcon('agent_commission')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <button
                    onClick={() => table.getColumn('closed_at')?.toggleSorting()}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                      table.getColumn('closed_at')?.getIsSorted() ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Won Date
                    {getSortIcon('closed_at')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  const deal = row.original;
                  const currentStage = deal.deal_type?.pipeline_stages.find(
                    (s) => s.code === deal.current_stage
                  );

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleDealClick(deal.id)}
                      className="transition-colors duration-200 hover:bg-muted/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium">{deal.deal_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">{deal.client?.name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{deal.deal_type?.type_name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {currentStage?.name || deal.current_stage}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{formatCurrency(deal.deal_value)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(deal.agent_commission)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{formatDate(deal.closed_at)}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="h-24 text-center text-muted-foreground">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
              onClick={() => handleDealClick(deal.id)}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{deal.deal_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {deal.client?.name || '-'}
                    </p>
                  </div>
                  <Badge variant="default" className="ml-2 shrink-0 bg-green-600 dark:bg-green-700">
                    Won
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
                    <span className="text-muted-foreground">Stage:</span>{' '}
                    <span>{currentStage?.name || deal.current_stage}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Won:</span>{' '}
                    <span>{formatDate(deal.closed_at)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Commission:</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(deal.agent_commission)}
                  </span>
                </div>
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
