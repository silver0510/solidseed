/**
 * useNotificationMutations Hook
 *
 * Handles mark-as-read actions with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, notificationQueryKeys } from '../api/notificationApi';
import { toast } from 'sonner';

/**
 * Hook for notification mutations (mark as read)
 */
export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      // Invalidate all notification queries to refetch
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to mark as read');
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: (data) => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      if (data.count > 0) {
        toast.success(`Marked ${data.count} notifications as read`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to mark all as read');
    },
  });

  return {
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
  };
}
