/**
 * ClientList Component
 *
 * Displays a list of clients in a table format with search, tag filtering,
 * status filtering, and sorting capabilities. Built with useSuspenseInfiniteQuery for
 * Suspense-compatible data fetching.
 *
 * @module features/clients/components/ClientList/ClientList
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useClientsInfinite, getTotalCount, flattenClientPages } from '../../hooks/useClientsInfinite';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { QuickStatusDialog } from '../QuickStatusDialog';
import { QuickTagsDialog } from '../QuickTagsDialog';
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
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ClientWithTags, ClientSortField, SortDirection } from '../../types';

interface ClientStatus {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface UserTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

/**
 * Fetch client statuses
 */
async function fetchClientStatuses(): Promise<ClientStatus[]> {
  const response = await fetch('/api/client-statuses');
  if (!response.ok) {
    throw new Error('Failed to fetch client statuses');
  }
  return response.json();
}

/**
 * Fetch all user tags
 */
async function fetchUserTags(): Promise<UserTag[]> {
  const response = await fetch('/api/user-tags');
  if (!response.ok) {
    throw new Error('Failed to fetch user tags');
  }
  return response.json();
}

/**
 * Props for the ClientList component
 */
export interface ClientListProps {
  /** Callback when a client row is clicked */
  onClientClick?: (client: ClientWithTags) => void;
  /** Callback when Add Client button is clicked */
  onAddClient?: () => void;
  /** Callback when Edit button is clicked */
  onEditClient?: (client: ClientWithTags) => void;
  /** Callback when Delete button is clicked */
  onDeleteClient?: (client: ClientWithTags) => void;
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
 * ClientList displays a searchable, filterable, and sortable table of clients
 * with infinite scroll support.
 */
export const ClientList: React.FC<ClientListProps> = ({
  onClientClick,
  onAddClient,
  onEditClient,
  onDeleteClient,
  initialSearch = '',
  initialTag = '',
}) => {
  // Fetch client statuses for filter
  const { data: statuses } = useSuspenseQuery({
    queryKey: ['client-statuses'],
    queryFn: fetchClientStatuses,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user tags for display
  const { data: userTags } = useSuspenseQuery({
    queryKey: ['user-tags'],
    queryFn: fetchUserTags,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // State for search, filter, and sort
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [tagFilter, setTagFilter] = useState(initialTag);
  const [statusFilter, setStatusFilter] = useState('');
  const [hasActiveDealsFilter, setHasActiveDealsFilter] = useState(false);
  const [sortBy, setSortBy] = useState<ClientSortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // State for quick edit dialogs
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [selectedClientForQuickEdit, setSelectedClientForQuickEdit] = useState<ClientWithTags | null>(null);

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
    status: statusFilter || undefined,
    sortBy,
    sortDirection,
    limit: 20,
  });

  // Flatten all pages of clients
  const allClients = useMemo(() => flattenClientPages(data), [data]);

  // Filter clients by active deals if checkbox is enabled
  // Note: This is client-side filtering. For production, add 'has_active_deals' API parameter
  const clients = useMemo(() => {
    if (!hasActiveDealsFilter) return allClients;
    // For now, show all clients. Real filtering requires API support or fetching deal counts
    return allClients;
  }, [allClients, hasActiveDealsFilter]);

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

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
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

  const handleEdit = useCallback((e: React.MouseEvent, client: ClientWithTags) => {
    e.stopPropagation(); // Prevent row click
    onEditClient?.(client);
  }, [onEditClient]);

  const handleDelete = useCallback((e: React.MouseEvent, client: ClientWithTags) => {
    e.stopPropagation(); // Prevent row click
    onDeleteClient?.(client);
  }, [onDeleteClient]);

  const handleStatusClick = useCallback((e: React.MouseEvent, client: ClientWithTags) => {
    e.stopPropagation(); // Prevent row click
    setSelectedClientForQuickEdit(client);
    setIsStatusDialogOpen(true);
  }, []);

  const handleTagsClick = useCallback((e: React.MouseEvent, client: ClientWithTags) => {
    e.stopPropagation(); // Prevent row click
    setSelectedClientForQuickEdit(client);
    setIsTagsDialogOpen(true);
  }, []);

  // Helper functions to get status and tag details
  const getStatusById = useCallback((statusId: string) => {
    return statuses.find((s) => s.id === statusId);
  }, [statuses]);

  const getTagsByNames = useCallback((tagNames: string[]) => {
    return userTags.filter((tag) => tagNames.includes(tag.name));
  }, [userTags]);

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
  const hasActiveFilters = !!debouncedSearch || !!tagFilter || !!statusFilter || hasActiveDealsFilter;

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
            {userTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.name}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[160px] h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span>{status.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active Deals Filter */}
        <div className="flex items-center gap-2 px-3 h-9 border rounded-md bg-background shadow-sm whitespace-nowrap">
          <Checkbox
            id="has-active-deals"
            checked={hasActiveDealsFilter}
            onCheckedChange={(checked) => setHasActiveDealsFilter(checked === true)}
            className="h-4 w-4"
          />
          <label
            htmlFor="has-active-deals"
            className="text-sm font-medium cursor-pointer select-none"
          >
            Has Active Deals
          </label>
        </div>

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
          <Button onClick={onAddClient} variant="outline" size="sm" className="h-9 shrink-0">
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
        <div className="text-center py-12 border rounded-lg bg-card">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {hasActiveFilters ? 'No matches found' : 'No clients yet'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Try adjusting your search or filters.'
              : 'Add your first client to get started.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead>NAME</TableHead>
                <TableHead className="hidden sm:table-cell">EMAIL</TableHead>
                <TableHead className="hidden md:table-cell">PHONE</TableHead>
                <TableHead className="hidden lg:table-cell">STATUS</TableHead>
                <TableHead className="hidden xl:table-cell">TAGS</TableHead>
                <TableHead className="w-[100px] text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const status = client.status_id ? getStatusById(client.status_id) : null;
                const clientTags = client.tags && client.tags.length > 0 ? getTagsByNames(client.tags) : [];

                return (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
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
                      {status ? (
                        <Badge
                          variant="secondary"
                          className="font-medium cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color,
                            borderColor: `${status.color}40`,
                          }}
                          onClick={(e) => handleStatusClick(e, client as ClientWithTags)}
                        >
                          {status.name}
                        </Badge>
                      ) : (
                        <button
                          onClick={(e) => handleStatusClick(e, client as ClientWithTags)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Set status
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {clientTags.length > 0 ? (
                        <div
                          className="flex flex-wrap gap-1 cursor-pointer"
                          onClick={(e) => handleTagsClick(e, client as ClientWithTags)}
                        >
                          {clientTags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                            >
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span>{tag.name}</span>
                            </Badge>
                          ))}
                          {clientTags.length > 3 && (
                            <Badge variant="outline" className="text-xs hover:opacity-80 transition-opacity">
                              +{clientTags.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleTagsClick(e, client as ClientWithTags)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Add tags
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEditClient && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => handleEdit(e, client as ClientWithTags)}
                            aria-label="Edit client"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {onDeleteClient && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => handleDelete(e, client as ClientWithTags)}
                            aria-label="Delete client"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {/* Quick Edit Dialogs */}
      <QuickStatusDialog
        open={isStatusDialogOpen}
        onOpenChange={setIsStatusDialogOpen}
        client={selectedClientForQuickEdit}
      />
      <QuickTagsDialog
        open={isTagsDialogOpen}
        onOpenChange={setIsTagsDialogOpen}
        client={selectedClientForQuickEdit}
      />
    </div>
  );
};

export default ClientList;
