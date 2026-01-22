/**
 * useClientsInfinite Hook
 *
 * Provides infinite scroll functionality for the client list using TanStack Query's
 * useSuspenseInfiniteQuery. Supports search, tag filtering, and sorting.
 *
 * @module features/clients/hooks/useClientsInfinite
 */

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { clientApi, clientQueryKeys } from '../api/clientApi';
import type {
  ListClientsOptions,
  ClientSortField,
  SortDirection,
  PaginatedClients,
} from '../types';

/**
 * Options for the useClientsInfinite hook
 */
export interface UseClientsInfiniteOptions {
  /** Search term to filter by name, email, or phone */
  search?: string;
  /** Filter by tag name */
  tag?: string;
  /** Filter by status ID */
  status?: string;
  /** Sort field */
  sortBy?: ClientSortField;
  /** Sort direction */
  sortDirection?: SortDirection;
  /** Number of items per page */
  limit?: number;
}

/**
 * Custom hook for infinite scrolling client list
 *
 * Uses useSuspenseInfiniteQuery for Suspense-compatible data fetching with
 * cursor-based pagination.
 *
 * @param options - Query options for filtering and sorting
 * @returns Infinite query result with clients data and pagination controls
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = useClientsInfinite({
 *   search: 'John',
 *   sortBy: 'name',
 *   sortDirection: 'asc',
 * });
 *
 * // Access all pages of clients
 * const allClients = data.pages.flatMap(page => page.data);
 * ```
 */
export function useClientsInfinite(options: UseClientsInfiniteOptions = {}) {
  const { search, tag, status, sortBy = 'created_at', sortDirection = 'desc', limit = 20 } = options;

  return useSuspenseInfiniteQuery({
    queryKey: clientQueryKeys.list({
      search,
      tag,
      status,
      sortBy,
      sortDirection,
      limit,
    }),
    queryFn: async ({ pageParam }) => {
      const params: ListClientsOptions = {
        cursor: pageParam as string | undefined,
        limit,
        search: search || undefined,
        tag: tag || undefined,
        status: status || undefined,
        sortBy,
        sortDirection,
      };

      // Transform PaginatedClients to include tags
      const result = await clientApi.listClients(params);

      // The API returns PaginatedClients, we transform to PaginatedClientsWithTags
      // by extracting tags from the client_tags relation (if present)
      return {
        data: result.data.map((client: any) => ({
          ...client,
          // Extract tag names from client_tags array: [{ tag_name: "VIP" }] -> ["VIP"]
          tags: client.client_tags
            ? client.client_tags.map((t: { tag_name: string }) => t.tag_name)
            : [],
        })),
        next_cursor: result.next_cursor,
        total_count: result.total_count,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get the total count from infinite query data
 */
export function getTotalCount(
  data: { pages: Array<{ total_count: number }> } | undefined
): number {
  if (!data?.pages?.length) return 0;
  return data.pages[0]?.total_count ?? 0;
}

/**
 * Flatten all pages of clients into a single array
 */
export function flattenClientPages<T extends { data: unknown[] }>(
  data: { pages: T[] } | undefined
): T['data'] {
  if (!data?.pages?.length) return [];
  return data.pages.flatMap((page) => page.data);
}

export default useClientsInfinite;
