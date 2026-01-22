'use client';

/**
 * QuickTagsDialog Component
 *
 * Quick dialog for updating client tags directly from the client list.
 * Opens when clicking on a client's tags.
 *
 * @module features/clients/components/QuickTagsDialog
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
import { TagSelect } from '../TagSelect/TagSelect';
import { Button } from '@/components/ui/button';
import { clientApi, clientQueryKeys } from '@/features/clients/api/clientApi';
import type { ClientWithTags } from '@/features/clients/types';

export interface QuickTagsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Client to update */
  client: ClientWithTags | null;
}

/**
 * QuickTagsDialog allows rapid tag updates without opening the full edit form
 */
export const QuickTagsDialog: React.FC<QuickTagsDialogProps> = ({
  open,
  onOpenChange,
  client,
}) => {
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = React.useState<string[]>(
    client?.tags ?? []
  );

  // Update tags when client changes
  React.useEffect(() => {
    setSelectedTags(client?.tags ?? []);
  }, [client]);

  const updateTagsMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) =>
      clientApi.updateClient(id, { tags: tags.length > 0 ? tags : undefined }),
    onMutate: async ({ id, tags }) => {
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
              c.id === id ? { ...c, tags } : c
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
      // Also invalidate user tags in case new tags were created
      await queryClient.invalidateQueries({ queryKey: ['user-tags'] });
      onOpenChange(false);
    },
  });

  const handleSave = async () => {
    if (!client) return;
    await updateTagsMutation.mutateAsync({
      id: client.id,
      tags: selectedTags,
    });
  };

  const handleCancel = () => {
    setSelectedTags(client?.tags ?? []);
    onOpenChange(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Update Tags</DialogTitle>
          <DialogDescription>
            Manage tags for {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="tags" className="block text-sm font-medium text-foreground">
              Tags
            </label>
            <Suspense fallback={<div className="h-10 bg-muted animate-pulse rounded-md" />}>
              <TagSelect
                value={selectedTags}
                onValueChange={setSelectedTags}
                disabled={updateTagsMutation.isPending}
                placeholder="Select tags"
              />
            </Suspense>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateTagsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={updateTagsMutation.isPending}
            >
              {updateTagsMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickTagsDialog;
