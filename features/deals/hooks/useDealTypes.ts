/**
 * useDealTypes Hook
 *
 * Fetches all active deal types for deal creation.
 */

import { useSuspenseQuery } from '@tanstack/react-query';
import type { DealType } from '../types';

async function fetchDealTypes(): Promise<DealType[]> {
  const response = await fetch('/api/deal-types');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch deal types' }));
    throw new Error(error.message || 'Failed to fetch deal types');
  }

  return response.json();
}

export function useDealTypes() {
  return useSuspenseQuery({
    queryKey: ['deal-types'],
    queryFn: fetchDealTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
