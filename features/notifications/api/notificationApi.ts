/**
 * Notification API Service Layer
 *
 * Provides a clean API interface for frontend components and React Query hooks.
 */

import type {
  Notification,
  NotificationFilters,
  PaginatedNotifications,
} from '@/lib/types/notification';
import { getBaseUrl, handleResponse, buildQueryString } from '@/lib/api/utils';

/**
 * Notification API methods
 */
export const notificationApi = {
  /**
   * List notifications with pagination and filtering
   */
  list: async (filters: NotificationFilters = {}): Promise<PaginatedNotifications> => {
    const baseUrl = getBaseUrl();
    const queryString = buildQueryString(filters);
    const response = await fetch(`${baseUrl}/api/notifications${queryString}`, {
      credentials: 'include',
    });
    return handleResponse<PaginatedNotifications>(response);
  },

  /**
   * Get unread count (for badge)
   */
  getUnreadCount: async (): Promise<number> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/notifications/unread-count`, {
      credentials: 'include',
    });
    const data = await handleResponse<{ count: number }>(response);
    return data.count;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
    return handleResponse<Notification>(response);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ count: number }> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: 'PATCH',
      credentials: 'include',
    });
    return handleResponse<{ count: number; message: string }>(response);
  },
};

/**
 * Query key factory for React Query
 */
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (filters: NotificationFilters) => [...notificationQueryKeys.lists(), filters] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
};
