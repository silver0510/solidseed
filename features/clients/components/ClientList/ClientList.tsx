/**
 * ClientList Component
 *
 * Displays a list of clients with infinite scroll, search, tag filtering,
 * and sorting capabilities. Built with useSuspenseInfiniteQuery for
 * Suspense-compatible data fetching.
 *
 * @module features/clients/components/ClientList/ClientList
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClientsInfinite, getTotalCount, flattenClientPages } from '../../hooks/useClientsInfinite';
import { ClientCard } from './ClientCard';
import type { ClientWithTags, ClientSortField, SortDirection } from '../../types';

/**
 * Props for the ClientList component
 */
export interface ClientListProps {
  /** Callback when a client card is clicked */
  onClientClick?: (client: ClientWithTags) => void;
  /** Initial search value */
  initialSearch?: string;
  /** Initial tag filter */
  initialTag?: string;
}

/**
 * Debounce hook for search input
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Sort options configuration
 */
const SORT_OPTIONS: Array<{ value: ClientSortField; label: string }> = [
  { value: 'created_at', label: 'Date Added' },
  { value: 'name', label: 'Name' },
  { value: 'updated_at', label: 'Last Updated' },
];

/**
 * Available tag options for filtering (placeholder - should be fetched from API)
 */
const TAG_OPTIONS = ['VIP', 'Buyer', 'Seller', 'First Home', 'Pre-Approved'];

/**
 * ClientList displays a searchable, filterable, and sortable list of clients
 * with infinite scroll support.
 *
 * Features:
 * - Debounced search (300ms)
 * - Tag filtering
 * - Sort by name, created date, or updated date
 * - Infinite scroll with IntersectionObserver
 * - Empty state handling
 * - Loading and error states
 * - Touch-friendly design
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <ClientList
 *   onClientClick={(client) => navigate(`/clients/${client.id}`)}
 *   initialSearch=""
 *   initialTag=""
 * />
 * ```
 */
export const ClientList: React.FC<ClientListProps> = ({
  onClientClick,
  initialSearch = '',
  initialTag = '',
}) => {
  // State for search, filter, and sort
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [tagFilter, setTagFilter] = useState(initialTag);
  const [sortBy, setSortBy] = useState<ClientSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Debounce search input by 300ms
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Ref for infinite scroll trigger
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Query client for cache operations
  const queryClient = useQueryClient();

  // Fetch clients with infinite scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
    refetch,
  } = useClientsInfinite({
    search: debouncedSearch || undefined,
    tag: tagFilter || undefined,
    sortBy,
    sortDirection,
    limit: 20,
  });

  // Flatten all pages of clients
  const clients = useMemo(() => flattenClientPages(data), [data]);
  const totalCount = getTotalCount(data);

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchInput('');
  }, []);

  const handleTagChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTagFilter(e.target.value);
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as ClientSortField);
  }, []);

  const handleToggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Error state
  if (error) {
    return (
      <main className="p-4" role="main">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Something went wrong. Failed to load clients.
          </p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // Empty state
  const isEmpty = clients.length === 0;
  const hasActiveFilters = !!debouncedSearch || !!tagFilter;

  return (
    <main className="p-4" role="main">
      {/* Search and Filter Controls */}
      <div className="mb-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <label htmlFor="client-search" className="sr-only">
            Search clients
          </label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            id="client-search"
            type="search"
            placeholder="Search clients..."
            value={searchInput}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px]"
            aria-label="Search clients"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-[44px] min-w-[44px] justify-center"
              aria-label="Clear search"
            >
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Filter and Sort Row */}
        <div className="flex gap-2 flex-wrap">
          {/* Tag Filter */}
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="tag-filter" className="sr-only">
              Filter by tag
            </label>
            <select
              id="tag-filter"
              value={tagFilter}
              onChange={handleTagChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px]"
              aria-label="Filter by tag"
            >
              <option value="">All Tags</option>
              {TAG_OPTIONS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="sort-by" className="sr-only">
              Sort by
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={handleSortChange}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px]"
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Direction Toggle */}
          <button
            onClick={handleToggleSortDirection}
            className="px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px]"
            aria-label={`Sort direction: ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? (
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {totalCount} client{totalCount !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </span>
        </div>
      </div>

      {/* Client List */}
      {isEmpty ? (
        <div className="text-center py-12">
          {hasActiveFilters ? (
            <>
              <p className="text-gray-600 mb-2">No clients match your search.</p>
              <p className="text-sm text-gray-500">
                Try adjusting your search or filters.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">No clients found.</p>
              <p className="text-sm text-gray-500">
                Add your first client to get started.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Client list">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client as ClientWithTags}
              onClick={onClientClick}
            />
          ))}

          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div
              ref={loadMoreRef}
              data-testid="infinite-scroll-trigger"
              className="flex justify-center py-4"
            >
              {isFetchingNextPage ? (
                <div
                  role="progressbar"
                  aria-label="Loading more clients"
                  data-testid="infinite-scroll-loading"
                  className="flex items-center gap-2 text-gray-600"
                >
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Loading more...</span>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">Scroll for more</span>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default ClientList;
