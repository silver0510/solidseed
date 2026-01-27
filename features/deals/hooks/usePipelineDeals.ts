/**
 * usePipelineDeals Hook
 *
 * React Query hook for fetching pipeline deals grouped by stage.
 *
 * @module features/deals/hooks/usePipelineDeals
 */

import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import type { PipelineResponse, GetPipelineParams } from '@/lib/types/deals';

// =============================================================================
// API HELPERS
// =============================================================================

/**
 * Get the base URL for API requests
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
}

/**
 * Handle API response and throw error if not ok
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Build query string from params
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch pipeline deals from API
 */
async function fetchPipelineDeals(params: GetPipelineParams = {}): Promise<PipelineResponse> {
  const baseUrl = getBaseUrl();
  const queryString = buildQueryString(params as Record<string, unknown>);
  const response = await fetch(`${baseUrl}/api/deals/pipeline${queryString}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const result = await handleResponse<{ success: boolean; data: PipelineResponse }>(response);
  return result.data;
}

// =============================================================================
// QUERY KEYS
// =============================================================================

export const pipelineKeys = {
  all: ['deals', 'pipeline'] as const,
  list: (params: GetPipelineParams) => [...pipelineKeys.all, params] as const,
};

// =============================================================================
// HOOK
// =============================================================================

export interface UsePipelineDealsOptions {
  dealTypeId?: string;
  assignedTo?: string;
  limit?: number;
}

/**
 * Hook for fetching pipeline deals with React Query
 *
 * @example
 * ```tsx
 * const { data, refetch } = usePipelineDeals({ dealTypeId: 'dt_123' });
 * ```
 */
export function usePipelineDeals(options: UsePipelineDealsOptions = {}) {
  const queryClient = useQueryClient();

  const params: GetPipelineParams = {
    deal_type_id: options.dealTypeId,
    assigned_to: options.assignedTo,
    limit: options.limit,
  };

  const query = useSuspenseQuery({
    queryKey: pipelineKeys.list(params),
    queryFn: () => fetchPipelineDeals(params),
    staleTime: 30000, // 30 seconds
  });

  /**
   * Invalidate and refetch pipeline data
   */
  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: pipelineKeys.all });
  };

  return {
    ...query,
    refetch,
  };
}

export default usePipelineDeals;
