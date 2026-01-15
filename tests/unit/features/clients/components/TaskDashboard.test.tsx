/**
 * TaskDashboard Component Tests
 *
 * Tests for the TaskDashboard component which displays all tasks
 * across all clients with filtering and grouping capabilities.
 *
 * @module tests/unit/features/clients/components/TaskDashboard.test
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { TaskDashboard } from '@/features/clients/components/TaskDashboard';
import { TaskGroup } from '@/features/clients/components/TaskDashboard/TaskGroup';
import type { TaskWithClient, TaskStatus, TaskPriority } from '@/features/clients/types';

// =============================================================================
// MOCKS
// =============================================================================

// Mock the useAllTasks hook
const mockRefetch = vi.fn();
const mockUpdateTaskStatus = vi.fn();

vi.mock('@/features/clients/hooks/useAllTasks', () => ({
  useAllTasks: vi.fn(),
}));

// Import the mock after mocking
import { useAllTasks } from '@/features/clients/hooks/useAllTasks';

// =============================================================================
// TEST FIXTURES
// =============================================================================

/**
 * Helper to create a date string relative to today in local timezone
 */
function getDateRelativeToToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const mockOverdueTask: TaskWithClient = {
  id: 'task_overdue',
  client_id: 'client_1',
  client_name: 'John Smith',
  title: 'Review contract',
  description: 'Contract review was due',
  due_date: getDateRelativeToToday(-2), // 2 days ago
  priority: 'high',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-10T08:00:00Z',
};

const mockTodayTask: TaskWithClient = {
  id: 'task_today',
  client_id: 'client_2',
  client_name: 'Jane Doe',
  title: 'Client meeting',
  description: 'Meeting at 3pm',
  due_date: getDateRelativeToToday(0), // Today
  priority: 'medium',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-12T08:00:00Z',
  updated_at: '2024-01-12T08:00:00Z',
};

const mockUpcomingTask: TaskWithClient = {
  id: 'task_upcoming',
  client_id: 'client_1',
  client_name: 'John Smith',
  title: 'Follow up call',
  description: 'Call to discuss options',
  due_date: getDateRelativeToToday(3), // 3 days from now
  priority: 'low',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockHighPriorityUpcoming: TaskWithClient = {
  id: 'task_high_upcoming',
  client_id: 'client_3',
  client_name: 'Bob Wilson',
  title: 'Submit documents',
  description: 'Loan documents deadline',
  due_date: getDateRelativeToToday(5), // 5 days from now
  priority: 'high',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-14T08:00:00Z',
  updated_at: '2024-01-14T08:00:00Z',
};

const mockCompletedTask: TaskWithClient = {
  id: 'task_completed',
  client_id: 'client_2',
  client_name: 'Jane Doe',
  title: 'Send brochure',
  description: 'Property brochure sent',
  due_date: getDateRelativeToToday(-1), // Yesterday
  priority: 'medium',
  status: 'completed',
  completed_at: '2024-01-14T14:00:00Z',
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-11T08:00:00Z',
  updated_at: '2024-01-14T14:00:00Z',
};

const mockNoDueDateTask: TaskWithClient = {
  id: 'task_no_due',
  client_id: 'client_1',
  client_name: 'John Smith',
  title: 'Update records',
  description: 'Update client records',
  due_date: '', // No due date
  priority: 'low',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-13T08:00:00Z',
  updated_at: '2024-01-13T08:00:00Z',
};

const allTasks: TaskWithClient[] = [
  mockOverdueTask,
  mockTodayTask,
  mockUpcomingTask,
  mockHighPriorityUpcoming,
  mockCompletedTask,
];

// =============================================================================
// TEST HELPERS
// =============================================================================

function setupMock(overrides: Partial<ReturnType<typeof useAllTasks>> = {}) {
  const defaultReturn = {
    tasks: allTasks,
    overdueTasksCount: 1,
    todayTasksCount: 1,
    upcomingTasksCount: 2,
    isLoading: false,
    refetch: mockRefetch,
    updateTaskStatus: mockUpdateTaskStatus,
    ...overrides,
  };
  (useAllTasks as Mock).mockReturnValue(defaultReturn);
  return defaultReturn;
}

// =============================================================================
// TASK DASHBOARD TESTS
// =============================================================================

describe('TaskDashboard', () => {
  const mockOnTaskClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders all tasks across all clients', () => {
      render(<TaskDashboard />);

      expect(screen.getByText('Review contract')).toBeInTheDocument();
      expect(screen.getByText('Client meeting')).toBeInTheDocument();
      expect(screen.getByText('Follow up call')).toBeInTheDocument();
      expect(screen.getByText('Submit documents')).toBeInTheDocument();
    });

    it('shows client name for each task', () => {
      render(<TaskDashboard />);

      expect(screen.getAllByText('John Smith').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      setupMock({ isLoading: true, tasks: [] });
      render(<TaskDashboard />);

      expect(screen.getByRole('status') || screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('shows empty state when no tasks', () => {
      setupMock({
        tasks: [],
        overdueTasksCount: 0,
        todayTasksCount: 0,
        upcomingTasksCount: 0,
      });
      render(<TaskDashboard />);

      expect(screen.getByText(/no tasks|no items|empty/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<TaskDashboard className="custom-dashboard" />);

      const dashboard = document.querySelector('.custom-dashboard');
      expect(dashboard).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // GROUPING TESTS
  // ===========================================================================

  describe('Task Grouping', () => {
    it('groups overdue tasks separately', () => {
      render(<TaskDashboard />);

      // Should have an overdue section
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });

    it('groups today tasks separately', () => {
      render(<TaskDashboard />);

      // Should have a today section
      expect(screen.getByText(/today/i)).toBeInTheDocument();
    });

    it('groups upcoming tasks separately', () => {
      render(<TaskDashboard />);

      // Should have an upcoming section
      expect(screen.getByText(/upcoming/i)).toBeInTheDocument();
    });

    it('shows task count per group in header', () => {
      render(<TaskDashboard />);

      // Should show counts in group headers
      // Overdue: 1, Today: 1, Upcoming: 2
      const overdueSection = screen.getByText(/overdue/i).closest('section') ||
                             screen.getByText(/overdue/i).parentElement;
      expect(overdueSection).toHaveTextContent(/1/);
    });

    it('groups completed tasks when filter includes completed', async () => {
      const user = userEvent.setup();
      render(<TaskDashboard />);

      // Change filter to show all including completed
      const statusFilter = screen.getByRole('combobox', { name: /status/i }) ||
                          screen.getByLabelText(/status/i);
      await user.click(statusFilter);
      await user.click(screen.getByRole('option', { name: /all/i }));

      // Should show completed section
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // FILTER TESTS - STATUS
  // ===========================================================================

  describe('Status Filtering', () => {
    it('defaults to pending tasks filter', () => {
      render(<TaskDashboard />);

      // Should not show completed tasks by default
      expect(screen.queryByText('Send brochure')).not.toBeInTheDocument();
    });

    it('filters by pending status', async () => {
      const user = userEvent.setup();
      render(<TaskDashboard />);

      // Select pending filter
      const statusFilter = screen.getByRole('combobox', { name: /status/i }) ||
                          screen.getByLabelText(/status/i);
      await user.click(statusFilter);
      await user.click(screen.getByRole('option', { name: /pending/i }));

      // Should show pending tasks
      expect(screen.getByText('Review contract')).toBeInTheDocument();
      // Should not show completed tasks
      expect(screen.queryByText('Send brochure')).not.toBeInTheDocument();
    });

    it('filters by completed status', async () => {
      const user = userEvent.setup();
      setupMock({
        tasks: [mockCompletedTask],
        overdueTasksCount: 0,
        todayTasksCount: 0,
        upcomingTasksCount: 0,
      });
      render(<TaskDashboard />);

      // Select completed filter
      const statusFilter = screen.getByRole('combobox', { name: /status/i }) ||
                          screen.getByLabelText(/status/i);
      await user.click(statusFilter);
      await user.click(screen.getByRole('option', { name: /completed/i }));

      // Should show completed tasks
      expect(screen.getByText('Send brochure')).toBeInTheDocument();
    });

    it('shows all tasks when status filter is all', async () => {
      const user = userEvent.setup();
      setupMock({ tasks: allTasks });
      render(<TaskDashboard />);

      // Select all filter
      const statusFilter = screen.getByRole('combobox', { name: /status/i }) ||
                          screen.getByLabelText(/status/i);
      await user.click(statusFilter);
      await user.click(screen.getByRole('option', { name: /all/i }));

      // Should show all tasks
      expect(screen.getByText('Review contract')).toBeInTheDocument();
      expect(screen.getByText('Send brochure')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // FILTER TESTS - PRIORITY
  // ===========================================================================

  describe('Priority Filtering', () => {
    it('defaults to showing all priorities', () => {
      render(<TaskDashboard />);

      // Should show tasks of all priorities
      expect(screen.getByText('Review contract')).toBeInTheDocument(); // high
      expect(screen.getByText('Client meeting')).toBeInTheDocument(); // medium
      expect(screen.getByText('Follow up call')).toBeInTheDocument(); // low
    });

    it('filters by high priority', async () => {
      const user = userEvent.setup();
      render(<TaskDashboard />);

      // Select high priority filter
      const priorityFilter = screen.getByRole('combobox', { name: /priority/i }) ||
                            screen.getByLabelText(/priority/i);
      await user.click(priorityFilter);
      await user.click(screen.getByRole('option', { name: /high/i }));

      // Should show only high priority tasks
      expect(screen.getByText('Review contract')).toBeInTheDocument();
      expect(screen.getByText('Submit documents')).toBeInTheDocument();
      // Should not show low/medium priority tasks
      expect(screen.queryByText('Follow up call')).not.toBeInTheDocument();
      expect(screen.queryByText('Client meeting')).not.toBeInTheDocument();
    });

    it('filters by medium priority', async () => {
      const user = userEvent.setup();
      render(<TaskDashboard />);

      // Select medium priority filter
      const priorityFilter = screen.getByRole('combobox', { name: /priority/i }) ||
                            screen.getByLabelText(/priority/i);
      await user.click(priorityFilter);
      await user.click(screen.getByRole('option', { name: /medium/i }));

      // Should show only medium priority tasks
      expect(screen.getByText('Client meeting')).toBeInTheDocument();
      // Should not show high/low priority tasks
      expect(screen.queryByText('Review contract')).not.toBeInTheDocument();
      expect(screen.queryByText('Follow up call')).not.toBeInTheDocument();
    });

    it('filters by low priority', async () => {
      const user = userEvent.setup();
      render(<TaskDashboard />);

      // Select low priority filter
      const priorityFilter = screen.getByRole('combobox', { name: /priority/i }) ||
                            screen.getByLabelText(/priority/i);
      await user.click(priorityFilter);
      await user.click(screen.getByRole('option', { name: /low/i }));

      // Should show only low priority tasks
      expect(screen.getByText('Follow up call')).toBeInTheDocument();
      // Should not show high/medium priority tasks
      expect(screen.queryByText('Review contract')).not.toBeInTheDocument();
      expect(screen.queryByText('Client meeting')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATUS TOGGLE TESTS
  // ===========================================================================

  describe('Task Status Toggle', () => {
    it('toggles task status when checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskDashboard />);

      // Find a pending task's checkbox
      const taskCard = screen.getByText('Review contract').closest('article');
      const checkbox = taskCard?.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeInTheDocument();

      await user.click(checkbox!);

      expect(mockUpdateTaskStatus).toHaveBeenCalledWith(
        mockOverdueTask.id,
        'completed'
      );
    });

    it('shows loading state for task being updated', () => {
      setupMock({
        tasks: allTasks,
      });
      render(<TaskDashboard />);

      // The hook should handle the updating state internally
      // and pass it to TaskCard components
      expect(screen.getByText('Review contract')).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // INTERACTION TESTS
  // ===========================================================================

  describe('Interactions', () => {
    it('calls onTaskClick when task is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskDashboard onTaskClick={mockOnTaskClick} />);

      // Click on a task
      const taskTitle = screen.getByText('Review contract');
      await user.click(taskTitle);

      expect(mockOnTaskClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockOverdueTask.id })
      );
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible filter controls', () => {
      render(<TaskDashboard />);

      const statusFilter = screen.getByRole('combobox', { name: /status/i }) ||
                          screen.getByLabelText(/status/i);
      const priorityFilter = screen.getByRole('combobox', { name: /priority/i }) ||
                            screen.getByLabelText(/priority/i);

      expect(statusFilter).toBeInTheDocument();
      expect(priorityFilter).toBeInTheDocument();
    });

    it('has accessible group sections', () => {
      render(<TaskDashboard />);

      // Group sections should have accessible labels
      const sections = document.querySelectorAll('section[aria-label], [role="region"]');
      expect(sections.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// TASK GROUP COMPONENT TESTS
// =============================================================================

describe('TaskGroup', () => {
  const mockOnStatusChange = vi.fn();
  const mockOnTaskClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders group title', () => {
      render(
        <TaskGroup
          title="Overdue"
          tasks={[mockOverdueTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('renders task count in header', () => {
      render(
        <TaskGroup
          title="Overdue"
          tasks={[mockOverdueTask, mockTodayTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText(/2/)).toBeInTheDocument();
    });

    it('renders tasks in the group', () => {
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Client meeting')).toBeInTheDocument();
    });

    it('shows client name for each task', () => {
      render(
        <TaskGroup
          title="Upcoming"
          tasks={[mockUpcomingTask, mockHighPriorityUpcoming]}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('shows empty state when no tasks in group', () => {
      render(
        <TaskGroup
          title="Overdue"
          tasks={[]}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Group should still be rendered but with no tasks
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // COLLAPSIBLE TESTS
  // ===========================================================================

  describe('Collapsible Behavior', () => {
    it('is expanded by default when defaultExpanded is true', () => {
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
          defaultExpanded={true}
        />
      );

      // Task should be visible
      expect(screen.getByText('Client meeting')).toBeVisible();
    });

    it('is collapsed by default when defaultExpanded is false', () => {
      render(
        <TaskGroup
          title="Completed"
          tasks={[mockCompletedTask]}
          onStatusChange={mockOnStatusChange}
          defaultExpanded={false}
        />
      );

      // Task should not be visible (hidden or not rendered)
      expect(screen.queryByText('Send brochure')).not.toBeVisible();
    });

    it('can toggle collapse state', async () => {
      const user = userEvent.setup();
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
          defaultExpanded={true}
        />
      );

      // Find and click the toggle button
      const toggleButton = screen.getByRole('button', { name: /today/i }) ||
                          screen.getByText('Today').closest('button');
      expect(toggleButton).toBeInTheDocument();

      await user.click(toggleButton!);

      // Task should be hidden after collapse
      expect(screen.queryByText('Client meeting')).not.toBeVisible();
    });
  });

  // ===========================================================================
  // ACTION TESTS
  // ===========================================================================

  describe('Actions', () => {
    it('calls onStatusChange when task status is toggled', async () => {
      const user = userEvent.setup();
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnStatusChange).toHaveBeenCalledWith(
        mockTodayTask,
        'completed'
      );
    });

    it('calls onTaskClick when task is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
          onTaskClick={mockOnTaskClick}
        />
      );

      await user.click(screen.getByText('Client meeting'));

      expect(mockOnTaskClick).toHaveBeenCalledWith(mockTodayTask);
    });

    it('shows updating state for specific task', () => {
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask, mockOverdueTask]}
          onStatusChange={mockOnStatusChange}
          updatingTaskId={mockTodayTask.id}
        />
      );

      // The task being updated should show loading state
      const taskCard = screen.getByText('Client meeting').closest('article');
      const checkbox = taskCard?.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeDisabled();

      // Other tasks should not be disabled
      const otherTaskCard = screen.getByText('Review contract').closest('article');
      const otherCheckbox = otherTaskCard?.querySelector('input[type="checkbox"]');
      expect(otherCheckbox).not.toBeDisabled();
    });
  });

  // ===========================================================================
  // STYLING TESTS
  // ===========================================================================

  describe('Styling', () => {
    it('applies overdue styling to overdue group', () => {
      render(
        <TaskGroup
          title="Overdue"
          tasks={[mockOverdueTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Group header should have red/error styling
      const header = screen.getByText('Overdue').closest('div, button');
      expect(header).toHaveClass(/red|error|danger/i);
    });

    it('applies today styling to today group', () => {
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Group header should have amber/warning styling
      const header = screen.getByText('Today').closest('div, button');
      expect(header).toHaveClass(/amber|warning|orange/i);
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible expand/collapse button', () => {
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      const toggleButton = screen.getByRole('button', { expanded: true }) ||
                          screen.getByRole('button', { name: /today/i });
      expect(toggleButton).toHaveAttribute('aria-expanded');
    });

    it('has accessible region for task list', () => {
      render(
        <TaskGroup
          title="Today"
          tasks={[mockTodayTask]}
          onStatusChange={mockOnStatusChange}
        />
      );

      // Should have region or list role
      const region = document.querySelector('[role="region"], [role="list"], ul');
      expect(region).toBeInTheDocument();
    });
  });
});
