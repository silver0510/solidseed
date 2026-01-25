/**
 * useDealDetail Hook
 *
 * Fetches a deal with all relations (deal type, client, milestones, documents, activities).
 * Uses React Query's useSuspenseQuery for automatic loading states.
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import type { DealWithRelations } from '../types';

async function fetchDealDetail(dealId: string): Promise<DealWithRelations> {
  const response = await fetch(`/api/deals/${dealId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch deal' }));
    throw new Error(error.message || error.error || 'Failed to fetch deal');
  }

  const result = await response.json();
  // API returns { success: true, data: deal }
  return result.data;
}

export function useDealDetail(dealId: string) {
  return useSuspenseQuery({
    queryKey: dealQueryKeys.detail(dealId),
    queryFn: () => fetchDealDetail(dealId),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Query key factory for easier invalidation
export const dealQueryKeys = {
  all: ['deals'] as const,
  lists: () => [...dealQueryKeys.all, 'list'] as const,
  list: (filters?: any) => [...dealQueryKeys.lists(), filters] as const,
  details: () => [...dealQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealQueryKeys.details(), id] as const,
  activities: (id: string) => [...dealQueryKeys.detail(id), 'activities'] as const,
  documents: (id: string) => [...dealQueryKeys.detail(id), 'documents'] as const,
  milestones: (id: string) => [...dealQueryKeys.detail(id), 'milestones'] as const,
};
