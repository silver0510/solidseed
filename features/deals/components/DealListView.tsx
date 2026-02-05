/**
 * DealListView Component
 * Table view for deals with sorting, filtering, and pagination
 * Mobile: Card view for screens < 768px
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate, getDaysInPipeline } from '@/lib/utils/formatters';
import type { Deal } from '@/lib/types/deals';
import { exportDealsToCSV } from '../utils/exportDealsToCSV';
import { toast } from 'sonner';
import { usePipelineDeals, pipelineKeys } from '../hooks/usePipelineDeals';

interface DealListViewProps {
  dealTypeId?: string;
}

export function DealListView({ dealTypeId }: DealListViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch deals data
  const { data } = usePipelineDeals({ dealTypeId });

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [changingStage, setChangingStage] = React.useState<string | null>(null);
  const [terminalStageModal, setTerminalStageModal] = React.useState<{
    isOpen: boolean;
    dealId: string | null;
    dealName: string | null;
    newStage: string | null;
    isClosedLost: boolean;
  }>({
    isOpen: false,
    dealId: null,
    dealName: null,
    newStage: null,
    isClosedLost: false,
  });
  const [lostReason, setLostReason] = React.useState('');

  // Flatten deals from all stages
  const deals = React.useMemo(() => {
    if (!data?.stages) return [];
    return data.stages.flatMap(stage => stage.deals);
  }, [data?.stages]);

  // Handle deal click - navigate to deal detail
  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  // Stage change mutation
  const stageChangeMutation = useMutation({
    mutationFn: async ({ dealId, newStage, lostReason }: { dealId: string; newStage: string; lostReason?: string }) => {
      const response = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_stage: newStage,
          ...(lostReason && { lost_reason: lostReason })
        }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Stage updated');
      queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['deals', 'won'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update stage');
    },
  });

  // Handle stage change
  const handleStageChange = async (dealId: string, newStage: string) => {
    // Find the deal to get its name and stage type
    const deal = deals.find(d => d.id === dealId);
    const dealName = deal?.deal_name || 'this deal';

    // Get stage type from deal type's pipeline stages
    const targetStage = deal?.deal_type?.pipeline_stages?.find(s => s.code === newStage);
    const stageType = targetStage?.type;

    // Check if new stage is terminal using type field with fallback to hardcoded logic
    const isClosedWon = stageType === 'won' || newStage === 'closed' || newStage === 'funded';
    const isClosedLost = stageType === 'lost' || newStage === 'lost';

    if (isClosedWon || isClosedLost) {
      // Show modal for terminal stages
      setTerminalStageModal({
        isOpen: true,
        dealId,
        dealName,
        newStage,
        isClosedLost,
      });
    } else {
      // Non-terminal stage, update immediately
      setChangingStage(dealId);
      try {
        await stageChangeMutation.mutateAsync({ dealId, newStage });
      } finally {
        setChangingStage(null);
      }
    }
  };

  // Close terminal stage modal
  const closeTerminalModal = () => {
    setTerminalStageModal({
      isOpen: false,
      dealId: null,
      dealName: null,
      newStage: null,
      isClosedLost: false,
    });
    setLostReason('');
  };

  // Confirm terminal stage change with optional reason
  const confirmTerminalStage = async () => {
    if (!terminalStageModal.dealId || !terminalStageModal.newStage) {
      return;
    }

    // Validate lost reason if needed
    if (terminalStageModal.isClosedLost && (!lostReason.trim() || lostReason.trim().length < 10)) {
      return; // Don't proceed if reason is missing or too short
    }

    setChangingStage(terminalStageModal.dealId);
    try {
      await stageChangeMutation.mutateAsync({
        dealId: terminalStageModal.dealId,
        newStage: terminalStageModal.newStage,
        lostReason: terminalStageModal.isClosedLost ? lostReason : undefined,
      });
    } finally {
      setChangingStage(null);
    }

    closeTerminalModal();
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
        header: 'Stage',
        cell: ({ row }) => {
          const deal = row.original;
          const stages = deal.deal_type?.pipeline_stages || [];
          const currentStage = stages.find((s) => s.code === deal.current_stage);

          if (stages.length === 0) {
            return (
              <Badge variant="outline" className="capitalize">
                {currentStage?.name || deal.current_stage}
              </Badge>
            );
          }

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Select
                value={deal.current_stage}
                onValueChange={(value) => handleStageChange(deal.id, value)}
                disabled={changingStage === deal.id}
              >
                <SelectTrigger className="w-select">
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
            </div>
          );
        },
      },
      {
        accessorKey: 'deal_value',
        header: 'Value',
        cell: ({ row }) => formatCurrency(row.original.deal_value),
      },
      {
        accessorKey: 'expected_close_date',
        header: 'Expected Close',
        cell: ({ row }) => formatDate(row.original.expected_close_date),
      },
      {
        accessorKey: 'days_in_pipeline',
        header: 'Days in Pipeline',
        cell: ({ row }) => {
          const days = getDaysInPipeline(row.original.created_at);
          return <span className="text-muted-foreground">{days} days</span>;
        },
      },
    ],
    [changingStage]
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

  if (deals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No deals found.
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
                <th className="px-4 py-3 text-left w-40">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stage
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
                <th className="px-4 py-3 text-left w-36">
                  <button
                    onClick={() => table.getColumn('expected_close_date')?.toggleSorting()}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                      table.getColumn('expected_close_date')?.getIsSorted() ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Expected Close
                    {getSortIcon('expected_close_date')}
                  </button>
                </th>
                <th className="px-4 py-3 text-left w-32">
                  <button
                    onClick={() => table.getColumn('days_in_pipeline')?.toggleSorting()}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                      table.getColumn('days_in_pipeline')?.getIsSorted() ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    Days in Pipeline
                    {getSortIcon('days_in_pipeline')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => {
                  const deal = row.original;
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
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {deal.deal_type?.pipeline_stages && deal.deal_type.pipeline_stages.length > 0 ? (
                          <Select
                            value={deal.current_stage}
                            onValueChange={(value) => handleStageChange(deal.id, value)}
                            disabled={changingStage === deal.id}
                          >
                            <SelectTrigger className="w-37.5">
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
                        ) : (
                          <Badge variant="outline" className="capitalize">
                            {deal.deal_type?.pipeline_stages.find((s) => s.code === deal.current_stage)?.name || deal.current_stage}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{formatCurrency(deal.deal_value)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{formatDate(deal.expected_close_date)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">{getDaysInPipeline(deal.created_at)} days</span>
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
                {deal.deal_type?.pipeline_stages && (
                  <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={deal.current_stage}
                      onValueChange={(value) => handleStageChange(deal.id, value)}
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

      {/* Terminal Stage Confirmation Modal */}
      <Dialog open={terminalStageModal.isOpen} onOpenChange={(open) => !open && closeTerminalModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {terminalStageModal.isClosedLost ? 'Mark Deal as Lost' : 'Mark Deal as Won'}
            </DialogTitle>
            <DialogDescription>
              {terminalStageModal.isClosedLost
                ? `You are about to mark "${terminalStageModal.dealName}" as lost. Please provide a reason.`
                : `You are about to mark "${terminalStageModal.dealName}" as won. This will close the deal.`}
            </DialogDescription>
          </DialogHeader>

          {terminalStageModal.isClosedLost && (
            <div className="space-y-2">
              <Label htmlFor="lost-reason">
                Reason for losing <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="lost-reason"
                placeholder="Enter the reason why this deal was lost (minimum 10 characters)"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="min-h-card-min"
              />
              {lostReason.length > 0 && lostReason.length < 10 && (
                <p className="text-sm text-destructive">
                  Please enter at least 10 characters ({10 - lostReason.length} more needed)
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeTerminalModal}>
              Cancel
            </Button>
            <Button
              onClick={confirmTerminalStage}
              disabled={terminalStageModal.isClosedLost && lostReason.trim().length < 10}
            >
              {terminalStageModal.isClosedLost ? 'Mark as Lost' : 'Mark as Won'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
