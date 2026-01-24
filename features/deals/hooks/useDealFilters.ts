/**
 * Hook for managing deal list filters with URL params and debouncing
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { DealStatus } from '@/lib/types/deals';

export interface DealFilters {
  dealTypeIds: string[];
  stages: string[];
  status: DealStatus | 'all';
  dateFrom: string | null;
  dateTo: string | null;
  assignedTo: string | null;
  search: string;
}

const DEFAULT_FILTERS: DealFilters = {
  dealTypeIds: [],
  stages: [],
  status: 'all',
  dateFrom: null,
  dateTo: null,
  assignedTo: null,
  search: '',
};

export function useDealFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<DealFilters>(DEFAULT_FILTERS);
  const [debouncedFilters, setDebouncedFilters] = useState<DealFilters>(DEFAULT_FILTERS);

  // Load filters from URL params on mount
  useEffect(() => {
    const dealTypeIds = searchParams.get('types')?.split(',').filter(Boolean) || [];
    const stages = searchParams.get('stages')?.split(',').filter(Boolean) || [];
    const status = (searchParams.get('status') as DealStatus | 'all') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search') || '';

    const urlFilters: DealFilters = {
      dealTypeIds,
      stages,
      status,
      dateFrom,
      dateTo,
      assignedTo,
      search,
    };

    setFilters(urlFilters);
    setDebouncedFilters(urlFilters);
  }, [searchParams]);

  // Debounce filter changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
      updateURL(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const updateURL = useCallback(
    (newFilters: DealFilters) => {
      const params = new URLSearchParams();

      if (newFilters.dealTypeIds.length > 0) {
        params.set('types', newFilters.dealTypeIds.join(','));
      }
      if (newFilters.stages.length > 0) {
        params.set('stages', newFilters.stages.join(','));
      }
      if (newFilters.status !== 'all') {
        params.set('status', newFilters.status);
      }
      if (newFilters.dateFrom) {
        params.set('dateFrom', newFilters.dateFrom);
      }
      if (newFilters.dateTo) {
        params.set('dateTo', newFilters.dateTo);
      }
      if (newFilters.assignedTo) {
        params.set('assignedTo', newFilters.assignedTo);
      }
      if (newFilters.search) {
        params.set('search', newFilters.search);
      }

      const queryString = params.toString();
      const url = queryString ? `?${queryString}` : '';
      router.replace(url, { scroll: false });
    },
    [router]
  );

  const setFilter = useCallback(
    <K extends keyof DealFilters>(key: K, value: DealFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.dealTypeIds.length > 0 ||
      filters.stages.length > 0 ||
      filters.status !== 'all' ||
      filters.dateFrom !== null ||
      filters.dateTo !== null ||
      filters.assignedTo !== null ||
      filters.search !== ''
    );
  }, [filters]);

  return {
    filters,
    debouncedFilters,
    setFilter,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}
