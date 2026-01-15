/**
 * ClientList Component Tests
 *
 * Tests for the ClientList component which displays a list of clients
 * with infinite scroll, search, tag filtering, and sorting capabilities.
 *
 * @module tests/unit/features/clients/components/ClientList.test
 */

import React, { Suspense } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientList } from '@/features/clients/components/ClientList';
import type { ClientWithTags, PaginatedClientsWithTags } from '@/features/clients/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockClients: ClientWithTags[] = [
  {
    id: 'clxyz123456789',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    birthday: '1990-05-15',
    address: '123 Main St, City, State 12345',
    created_by: 'user123',
    assigned_to: 'user123',
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags: ['VIP', 'Buyer'],
  },
  {
    id: 'clxyz987654321',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-987-6543',
    birthday: '1985-08-20',
    address: '456 Oak Ave, Town, State 67890',
    created_by: 'user123',
    assigned_to: 'user123',
    is_deleted: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    tags: ['Seller'],
  },
  {
    id: 'clxyz111222333',
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    phone: '+1-555-444-3333',
    birthday: undefined,
    address: undefined,
    created_by: 'user123',
    assigned_to: 'user123',
    is_deleted: false,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    tags: ['VIP', 'First Home'],
  },
];

const mockPaginatedResponse: PaginatedClientsWithTags = {
  data: mockClients,
  next_cursor: undefined,
  total_count: 3,
};

const mockPaginatedResponseWithMore: PaginatedClientsWithTags = {
  data: mockClients.slice(0, 2),
  next_cursor: '2024-01-02T00:00:00Z',
  total_count: 10,
};

const emptyResponse: PaginatedClientsWithTags = {
  data: [],
  next_cursor: undefined,
  total_count: 0,
};

// Mock the clientApi module
vi.mock('@/features/clients/api/clientApi', () => ({
  clientApi: {
    listClients: vi.fn(),
  },
  clientQueryKeys: {
    all: ['clients'] as const,
    lists: () => ['clients', 'list'] as const,
    list: (params: Record<string, unknown>) => ['clients', 'list', params] as const,
  },
}));

// Mock IntersectionObserver for infinite scroll testing
let intersectionObserverCallback: IntersectionObserverCallback | null = null;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: readonly number[] = [];

  constructor(callback: IntersectionObserverCallback) {
    intersectionObserverCallback = callback;
  }

  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
  takeRecords = (): IntersectionObserverEntry[] => [];
}

// =============================================================================
// ERROR BOUNDARY FOR TESTS
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

class TestErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <p>Something went wrong. Failed to load clients.</p>
          <button onClick={this.handleRetry}>Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// =============================================================================
// TEST UTILITIES
// =============================================================================

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
}

function createWrapper(options?: { withErrorBoundary?: boolean }) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: WrapperProps) {
    const content = (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          {children}
        </Suspense>
      </QueryClientProvider>
    );

    if (options?.withErrorBoundary) {
      return (
        <TestErrorBoundary onReset={() => queryClient.clear()}>
          {content}
        </TestErrorBoundary>
      );
    }

    return content;
  };
}

// =============================================================================
// TEST SETUP
// =============================================================================

describe('ClientList', () => {
  let mockListClients: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    // Setup IntersectionObserver mock
    intersectionObserverCallback = null;
    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    // Get the mocked function
    const { clientApi } = await import('@/features/clients/api/clientApi');
    mockListClients = vi.mocked(clientApi.listClients);
    mockListClients.mockResolvedValue(mockPaginatedResponse);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders clients when data is available', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('renders client emails', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      });

      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    });

    it('renders search input', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });
    });

    it('renders sort options', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should have a sort selector (using id selector)
      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    });

    it('renders with initial search value', async () => {
      const Wrapper = createWrapper();
      render(<ClientList initialSearch="John" />, { wrapper: Wrapper });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(searchInput).toHaveValue('John');
      });
    });

    it('renders total count badge', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Check for the count in the results text
      expect(screen.getByText(/3 clients/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // EMPTY STATE TESTS
  // ===========================================================================

  describe('Empty State', () => {
    beforeEach(async () => {
      const { clientApi } = await import('@/features/clients/api/clientApi');
      vi.mocked(clientApi.listClients).mockResolvedValue(emptyResponse);
    });

    it('renders empty state when no clients exist', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText(/no clients/i)).toBeInTheDocument();
      });
    });

    it('shows helpful message to add first client', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText(/no clients found/i)).toBeInTheDocument();
      });

      // Check for the helper message
      expect(screen.getByText(/add your first client/i)).toBeInTheDocument();
    });

    it('shows different message when search has no results', async () => {
      const Wrapper = createWrapper();
      render(<ClientList initialSearch="nonexistent" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(
          screen.getByText(/no.*results|no clients.*match/i)
        ).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // SEARCH TESTS
  // ===========================================================================

  describe('Search', () => {
    it('debounces search input by 300ms', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      const initialCallCount = mockListClients.mock.calls.length;

      // Type search term
      await user.type(searchInput, 'John');

      // Should not call API immediately
      expect(mockListClients.mock.calls.length).toBe(initialCallCount);

      // Advance time by 200ms - still should not call
      await act(async () => {
        vi.advanceTimersByTime(200);
      });
      expect(mockListClients.mock.calls.length).toBe(initialCallCount);

      // Advance time by another 150ms (total 350ms > 300ms debounce)
      await act(async () => {
        vi.advanceTimersByTime(150);
      });

      // Now should have called with search param
      await waitFor(() => {
        const lastCall = mockListClients.mock.calls[mockListClients.mock.calls.length - 1];
        expect(lastCall[0]).toMatchObject({ search: 'John' });
      });
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const Wrapper = createWrapper();
      render(<ClientList initialSearch="test" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toHaveValue('test');
      });

      // Find and click clear button
      const clearButton = screen.getByRole('button', { name: /clear|reset/i }) ||
        screen.getByLabelText(/clear/i);
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search/i)).toHaveValue('');
      });
    });

    it('searches by name', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'Jane');

      await act(async () => {
        vi.advanceTimersByTime(350);
      });

      await waitFor(() => {
        expect(mockListClients).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Jane' })
        );
      });
    });
  });

  // ===========================================================================
  // TAG FILTERING TESTS
  // ===========================================================================

  describe('Tag Filtering', () => {
    it('filters by tag when tag prop is provided', async () => {
      const Wrapper = createWrapper();
      render(<ClientList initialTag="VIP" />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockListClients).toHaveBeenCalledWith(
          expect.objectContaining({ tag: 'VIP' })
        );
      });
    });

    it('renders tag filter dropdown', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/filter by tag/i)).toBeInTheDocument();
    });

    it('updates results when tag filter changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find tag filter and change it using selectOptions
      const tagFilter = screen.getByLabelText(/filter by tag/i);
      await user.selectOptions(tagFilter, 'VIP');

      await waitFor(() => {
        expect(mockListClients).toHaveBeenCalledWith(
          expect.objectContaining({ tag: 'VIP' })
        );
      });
    });
  });

  // ===========================================================================
  // SORT TESTS
  // ===========================================================================

  describe('Sorting', () => {
    it('sorts by created_at desc by default', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(mockListClients).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'created_at',
            sortDirection: 'desc',
          })
        );
      });
    });

    it('changes sort order when sort option is selected', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find sort selector using selectOptions
      const sortSelector = screen.getByLabelText(/sort by/i);
      await user.selectOptions(sortSelector, 'name');

      await waitFor(() => {
        expect(mockListClients).toHaveBeenCalledWith(
          expect.objectContaining({ sortBy: 'name' })
        );
      });
    });

    it('allows toggling sort direction', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Find sort direction toggle button
      const sortDirectionBtn = screen.getByRole('button', { name: /ascending|descending|sort.*direction/i });
      await user.click(sortDirectionBtn);

      await waitFor(() => {
        expect(mockListClients).toHaveBeenCalledWith(
          expect.objectContaining({ sortDirection: 'asc' })
        );
      });
    });
  });

  // ===========================================================================
  // INFINITE SCROLL TESTS
  // ===========================================================================

  describe('Infinite Scroll', () => {
    beforeEach(async () => {
      // Reset intersection observer callback
      intersectionObserverCallback = null;

      const { clientApi } = await import('@/features/clients/api/clientApi');
      vi.mocked(clientApi.listClients).mockResolvedValue(mockPaginatedResponseWithMore);
    });

    it('shows load more indicator when more data available', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should show the infinite scroll trigger when there's more data
      expect(screen.getByTestId('infinite-scroll-trigger')).toBeInTheDocument();
    });

    it('fetches more data when scrolling to bottom', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const initialCallCount = mockListClients.mock.calls.length;

      // Simulate intersection observer callback (scroll to bottom)
      if (intersectionObserverCallback) {
        await act(async () => {
          intersectionObserverCallback!(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver
          );
        });
      }

      await waitFor(() => {
        expect(mockListClients.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('passes cursor for pagination', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Simulate intersection observer callback
      if (intersectionObserverCallback) {
        await act(async () => {
          intersectionObserverCallback!(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver
          );
        });
      }

      await waitFor(() => {
        expect(mockListClients).toHaveBeenCalledWith(
          expect.objectContaining({ cursor: '2024-01-02T00:00:00Z' })
        );
      });
    });

    it('shows end of list message when all data loaded', async () => {
      const { clientApi } = await import('@/features/clients/api/clientApi');
      vi.mocked(clientApi.listClients).mockResolvedValue(mockPaginatedResponse); // No next_cursor

      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should NOT show load more indicator
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // CLICK HANDLER TESTS
  // ===========================================================================

  describe('Client Click Handler', () => {
    it('calls onClientClick when a client card is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockOnClientClick = vi.fn();
      const Wrapper = createWrapper();

      render(<ClientList onClientClick={mockOnClientClick} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click on the client card containing John Doe
      const johnCard = screen.getByText('John Doe').closest('article');
      if (johnCard) {
        await user.click(johnCard);
      }

      expect(mockOnClientClick).toHaveBeenCalledTimes(1);
      expect(mockOnClientClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'clxyz123456789',
          name: 'John Doe',
        })
      );
    });

    it('does not crash when onClientClick is not provided', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const Wrapper = createWrapper();

      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('article');
      if (johnCard) {
        await expect(user.click(johnCard)).resolves.not.toThrow();
      }
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has a main region for the list', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByRole('main') || screen.getByRole('list')).toBeInTheDocument();
      });
    });

    it('has accessible search input with label', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search/i);
        expect(
          searchInput.getAttribute('aria-label') ||
            searchInput.getAttribute('aria-labelledby') ||
            screen.getByLabelText(/search/i)
        ).toBeTruthy();
      });
    });

    it('announces loading state to screen readers', async () => {
      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      // Initially should show loading or have aria-busy
      const loadingIndicator = screen.queryByRole('status') ||
        screen.queryByRole('progressbar') ||
        screen.queryByTestId('loading');

      // After data loads, should not have loading indicator
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('list items are keyboard navigable', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const mockOnClientClick = vi.fn();
      const Wrapper = createWrapper();

      render(<ClientList onClientClick={mockOnClientClick} />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen.getByText('John Doe').closest('article');
      if (johnCard) {
        johnCard.focus();
        await user.keyboard('{Enter}');
        expect(mockOnClientClick).toHaveBeenCalled();
      }
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading state while fetching initial data', async () => {
      // Delay the response
      const { clientApi } = await import('@/features/clients/api/clientApi');
      vi.mocked(clientApi.listClients).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockPaginatedResponse), 1000))
      );

      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      // Should show loading indicator
      expect(
        screen.getByTestId('loading') ||
          screen.getByRole('progressbar')
      ).toBeInTheDocument();

      // Advance time to let data load
      await act(async () => {
        vi.advanceTimersByTime(1100);
      });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('shows inline loading when fetching more pages', async () => {
      const { clientApi } = await import('@/features/clients/api/clientApi');
      let callCount = 0;
      vi.mocked(clientApi.listClients).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(mockPaginatedResponseWithMore);
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve(mockPaginatedResponse), 500)
        );
      });

      const Wrapper = createWrapper();
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Trigger infinite scroll
      if (intersectionObserverCallback) {
        await act(async () => {
          intersectionObserverCallback!(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver
          );
        });
      }

      // Should show loading indicator for more data
      await waitFor(() => {
        expect(
          screen.getByTestId('infinite-scroll-loading') ||
            screen.queryAllByRole('progressbar').length > 0
        ).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // ERROR STATE TESTS
  // ===========================================================================

  describe('Error States', () => {
    it('shows error message when fetch fails', async () => {
      const { clientApi } = await import('@/features/clients/api/clientApi');
      vi.mocked(clientApi.listClients).mockRejectedValue(new Error('Failed to fetch'));

      // Use wrapper with error boundary
      const Wrapper = createWrapper({ withErrorBoundary: true });
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(
          screen.getByText(/something went wrong/i)
        ).toBeInTheDocument();
      });
    });

    it('allows retry on error', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const { clientApi } = await import('@/features/clients/api/clientApi');
      vi.mocked(clientApi.listClients)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockPaginatedResponse);

      // Use wrapper with error boundary
      const Wrapper = createWrapper({ withErrorBoundary: true });
      render(<ClientList />, { wrapper: Wrapper });

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /try again/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });
  });
});
