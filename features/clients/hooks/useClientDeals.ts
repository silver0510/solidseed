/**
 * useClientDeals Hook
 *
 * Fetches and manages active deals for a specific client.
 *
 * @module features/clients/hooks/useClientDeals
 */

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Deal status type
 */
export type DealStatus = 'active' | 'pending' | 'closed_won' | 'closed_lost' | 'cancelled';

/**
 * Minimal deal type for client widget display
 */
export interface ClientDeal {
  /** Deal ID */
  id: string;
  /** Deal name/title */
  deal_name: string;
  /** Deal type details */
  deal_type?: {
    id: string;
    type_code: string;
    type_name: string;
    icon: string | null;
    color: string | null;
  };
  /** Current pipeline stage */
  current_stage: string;
  /** Deal status */
  status: DealStatus;
  /** Deal value/amount */
  deal_value: number | null;
  /** Expected close date */
  expected_close_date: string | null;
  /** Creation timestamp */
  created_at: string;
}

/**
 * Options for the useClientDeals hook
 */
export interface UseClientDealsOptions {
  /** ID of the client to fetch deals for */
  clientId: string;
  /** Limit number of deals to fetch (default: 10) */
  limit?: number;
  /** Only fetch active deals (default: true) */
  activeOnly?: boolean;
}

/**
 * Return value from the useClientDeals hook
 */
export interface UseClientDealsReturn {
  /** Array of client deals */
  deals: ClientDeal[];
  /** Total count of deals (may be more than returned if limited) */
  totalCount: number;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch deals data */
  refetch: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for fetching and managing client deals
 *
 * @example
 * ```tsx
 * const { deals, totalCount, isLoading, error, refetch } = useClientDeals({
 *   clientId: 'cl123',
 *   limit: 10,
 *   activeOnly: true
 * });
 * ```
 */
export function useClientDeals({
  clientId,
  limit = 10,
  activeOnly = true,
}: UseClientDealsOptions): UseClientDealsReturn {
  const [deals, setDeals] = useState<ClientDeal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        client_id: clientId,
        limit: limit.toString(),
      });

      if (activeOnly) {
        params.append('status', 'active');
      }

      // Fetch deals from API
      const response = await fetch(`/api/deals?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle response structure
      if (data.success && data.data) {
        setDeals(data.data.deals || []);
        setTotalCount(data.data.total || data.data.deals?.length || 0);
      } else {
        setDeals([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch client deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
      setDeals([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, limit, activeOnly]);

  // Initial fetch on mount and when dependencies change
  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return {
    deals,
    totalCount,
    isLoading,
    error,
    refetch: fetchDeals,
  };
}

export default useClientDeals;
