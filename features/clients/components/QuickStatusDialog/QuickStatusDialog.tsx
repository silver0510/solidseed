'use client';

/**
 * QuickStatusDialog Component
 *
 * Quick dialog for updating client status directly from the client list.
 * Opens when clicking on a client's status badge.
 *
 * @module features/clients/components/QuickStatusDialog
 */

import React, { Suspense } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusSelect } from '../StatusSelect/StatusSelect';
import { Button } from '@/components/ui/button';
import { clientApi, clientQueryKeys } from '@/features/clients/api/clientApi';
import type { ClientWithTags } from '@/features/clients/types';

export interface QuickStatusDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Client to update */
  client: ClientWithTags | null;
}

/**
 * QuickStatusDialog allows rapid status updates without opening the full edit form
 */
export const QuickStatusDialog: React.FC<QuickStatusDialogProps> = ({
  open,
  onOpenChange,
  client,
}) => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = React.useState<string | undefined>(
    client?.status_id ?? undefined
  );

  // Update status when client changes
  React.useEffect(() => {
    setSelectedStatus(client?.status_id ?? undefined);
  }, [client]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status_id }: { id: string; status_id: string | undefined }) =>
      clientApi.updateClient(id, { status_id }),
    onMutate: async ({ id, status_id }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: clientQueryKeys.all });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: clientQueryKeys.all });

      // Optimistically update all client list queries
      queryClient.setQueriesData({ queryKey: clientQueryKeys.all }, (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((c: any) =>
              c.id === id ? { ...c, status_id } : c
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: async () => {
      // Invalidate all client queries to ensure the list refreshes with server data
      await queryClient.invalidateQueries({
        queryKey: clientQueryKeys.all,
        refetchType: 'all'
      });
      onOpenChange(false);
    },
  });

  const handleSave = async () => {
    if (!client) return;
    await updateStatusMutation.mutateAsync({
      id: client.id,
      status_id: selectedStatus,
    });
  };

  const handleCancel = () => {
    setSelectedStatus(client?.status_id ?? undefined);
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription>
            Change the status for {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium text-foreground">
              Status
            </label>
            <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded-md" />}>
              <StatusSelect
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={updateStatusMutation.isPending}
                placeholder="Select status"
              />
            </Suspense>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickStatusDialog;
