/**
 * useUnreadCount Hook
 *
 * Lightweight hook for unread count badge (used in sidebar)
 */

import { useQuery } from '@tanstack/react-query';
import { notificationApi, notificationQueryKeys } from '../api/notificationApi';

export interface UseUnreadCountOptions {
  /** Enable polling for live updates (default: true) */
  polling?: boolean;
  /** Polling interval in ms (default: 60000 = 1 minute) */
  pollingInterval?: number;
}

/**
 * Hook for fetching unread notification count
 */
export function useUnreadCount(options: UseUnreadCountOptions = {}) {
  const { polling = true, pollingInterval = 60000 } = options;

  const query = useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: polling ? pollingInterval : false,
    refetchOnWindowFocus: true,
  });

  return {
    count: query.data || 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
