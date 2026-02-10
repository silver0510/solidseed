/**
 * useNotifications Hook
 *
 * Fetches and manages notifications with polling for live updates
 */

import { useQuery } from '@tanstack/react-query';
import { notificationApi, notificationQueryKeys } from '../api/notificationApi';
import type { NotificationFilters } from '@/lib/types/notification';

export interface UseNotificationsOptions {
  filters?: NotificationFilters;
  /** Enable polling for live updates (default: true) */
  polling?: boolean;
  /** Polling interval in ms (default: 60000 = 1 minute) */
  pollingInterval?: number;
}

/**
 * Hook for fetching notifications
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { filters = {}, polling = true, pollingInterval = 60000 } = options;

  const query = useQuery({
    queryKey: notificationQueryKeys.list(filters),
    queryFn: () => notificationApi.list(filters),
    refetchInterval: polling ? pollingInterval : false,
    refetchOnWindowFocus: true,
  });

  return {
    notifications: query.data?.data || [],
    unreadCount: query.data?.unread_count || 0,
    totalCount: query.data?.total_count || 0,
    nextCursor: query.data?.next_cursor || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
