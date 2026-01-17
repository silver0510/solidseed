/**
 * ClientList Component
 *
 * Displays a list of clients in a table format with search, tag filtering,
 * and sorting capabilities. Built with useSuspenseInfiniteQuery for
 * Suspense-compatible data fetching.
 *
 * @module features/clients/components/ClientList/ClientList
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useClientsInfinite, getTotalCount, flattenClientPages } from '../../hooks/useClientsInfinite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  SearchIcon,
  XIcon,
  ArrowUpDownIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from 'lucide-react';
import type { ClientWithTags, ClientSortField, SortDirection } from '../../types';

/**
 * Props for the ClientList component
 */
export interface ClientListProps {
  /** Callback when a client row is clicked */
  onClientClick?: (client: ClientWithTags) => void;
  /** Callback when Add Client button is clicked */
  onAddClient?: () => void;
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
 * ClientList displays a searchable, filterable, and sortable table of clients
 * with infinite scroll support.
 */
export const ClientList: React.FC<ClientListProps> = ({
  onClientClick,
  onAddClient,
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

  const handleTagChange = useCallback((value: string) => {
    setTagFilter(value === 'all' ? '' : value);
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value as ClientSortField);
  }, []);

  const handleToggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleRowClick = useCallback((client: ClientWithTags) => {
    onClientClick?.(client);
  }, [onClientClick]);

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">
          Failed to load clients.
        </p>
        <Button onClick={handleRetry} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  const isEmpty = clients.length === 0;
  const hasActiveFilters = !!debouncedSearch || !!tagFilter;

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Filter, Sort, Add */}
      <div className="flex flex-col sm:flex-row gap-2 p-2 bg-muted/50 rounded-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-8 pr-8 h-9"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tag Filter */}
        <Select value={tagFilter || 'all'} onValueChange={handleTagChange}>
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {TAG_OPTIONS.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full sm:w-[140px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Direction */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSortDirection}
          className="h-9 w-9 shrink-0 bg-transparent border border-input shadow-sm"
          title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortDirection === 'asc' ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </Button>

        {/* Add Client Button */}
        {onAddClient && (
          <Button onClick={onAddClient} className="h-9 shrink-0">
            <PlusIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add Client</span>
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {totalCount} client{totalCount !== 1 ? 's' : ''}
        {hasActiveFilters && ' (filtered)'}
      </div>

      {/* Client Table */}
      {isEmpty ? (
        <div className="text-center py-12 border rounded-lg">
          {hasActiveFilters ? (
            <p className="text-muted-foreground">No clients match your search.</p>
          ) : (
            <p className="text-muted-foreground">No clients yet. Add your first client to get started.</p>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(client as ClientWithTags)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {client.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-muted-foreground">{client.email}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground">{client.phone || '—'}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.tags && client.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {client.tags.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {client.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{client.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4 border-t">
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading more...
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Scroll for more</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientList;
