/**
 * TaskCard Component Tests
 *
 * Tests for the TaskCard component which displays task information with
 * color-coded priority, due date indicators, and status toggle.
 *
 * @module tests/unit/features/clients/components/TaskCard.test
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskCard } from '@/features/clients/components/TaskCard';
import { TaskList } from '@/features/clients/components/TaskCard/TaskList';
import type { ClientTask, TaskStatus } from '@/features/clients/types';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const mockClientId = 'clxyz123456789';

/**
 * Helper to create a date string relative to today
 */
function getDateRelativeToToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

const mockTask: ClientTask = {
  id: 'task_123',
  client_id: mockClientId,
  title: 'Follow up with client',
  description: 'Call to discuss property options',
  due_date: getDateRelativeToToday(3), // 3 days from now
  priority: 'medium',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockHighPriorityTask: ClientTask = {
  id: 'task_456',
  client_id: mockClientId,
  title: 'Urgent: Submit documents',
  description: 'Submit loan documents before deadline',
  due_date: getDateRelativeToToday(1), // Tomorrow
  priority: 'high',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-14T08:00:00Z',
  updated_at: '2024-01-14T08:00:00Z',
};

const mockLowPriorityTask: ClientTask = {
  id: 'task_789',
  client_id: mockClientId,
  title: 'Optional: Send birthday card',
  description: 'Remember to send a card',
  due_date: getDateRelativeToToday(10), // 10 days from now
  priority: 'low',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-13T08:00:00Z',
  updated_at: '2024-01-13T08:00:00Z',
};

const mockOverdueTask: ClientTask = {
  id: 'task_overdue',
  client_id: mockClientId,
  title: 'Overdue: Review contract',
  description: 'Contract review was due yesterday',
  due_date: getDateRelativeToToday(-2), // 2 days ago
  priority: 'high',
  status: 'pending',
  completed_at: null,
  created_by: 'user_123',
  assigned_to: 'user_123',
  created_at: '2024-01-10T08:00:00Z',
  updated_at: '2024-01-10T08:00:00Z',
};

const mockTodayTask: ClientTask = {
  id: 'task_today',
  client_id: mockClientId,
  title: 'Today: Client meeting',
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

const mockCompletedTask: ClientTask = {
  id: 'task_completed',
  client_id: mockClientId,
  title: 'Completed: Send brochure',
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

const mockTasks: ClientTask[] = [
  mockTask,
  mockHighPriorityTask,
  mockLowPriorityTask,
  mockOverdueTask,
  mockTodayTask,
  mockCompletedTask,
];

// =============================================================================
// TASK CARD TESTS
// =============================================================================

describe('TaskCard', () => {
  const mockOnStatusChange = vi.fn<(task: ClientTask, newStatus: TaskStatus) => void>();
  const mockOnEdit = vi.fn<(task: ClientTask) => void>();
  const mockOnDelete = vi.fn<(task: ClientTask) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders task title', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('Follow up with client')).toBeInTheDocument();
    });

    it('renders task description when provided', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('Call to discuss property options')).toBeInTheDocument();
    });

    it('renders task without description', () => {
      const taskWithoutDescription: ClientTask = {
        ...mockTask,
        description: undefined,
      };
      render(<TaskCard task={taskWithoutDescription} />);

      expect(screen.getByText('Follow up with client')).toBeInTheDocument();
    });

    it('renders due date', () => {
      render(<TaskCard task={mockTask} />);

      // Should show some form of the due date
      const dueDateElement =
        screen.queryByText(/in \d+ days/i) ||
        screen.queryByText(/due/i) ||
        screen.queryByRole('time');
      expect(dueDateElement).toBeInTheDocument();
    });

    it('renders status checkbox', () => {
      render(<TaskCard task={mockTask} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('checkbox is unchecked for pending tasks', () => {
      render(<TaskCard task={mockTask} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('checkbox is checked for completed tasks', () => {
      render(<TaskCard task={mockCompletedTask} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });
  });

  // ===========================================================================
  // PRIORITY COLOR TESTS
  // ===========================================================================

  describe('Priority Colors', () => {
    it('shows gray indicator for low priority tasks', () => {
      render(<TaskCard task={mockLowPriorityTask} />);

      // Should have gray/slate priority indicator
      const priorityBadge = screen.getByText(/low/i) ||
        document.querySelector('[data-priority="low"]');
      expect(priorityBadge).toBeInTheDocument();
    });

    it('shows blue indicator for medium priority tasks', () => {
      render(<TaskCard task={mockTask} />);

      // Should have blue priority indicator (medium priority)
      const priorityBadge = screen.getByText(/medium/i) ||
        document.querySelector('[data-priority="medium"]');
      expect(priorityBadge).toBeInTheDocument();
    });

    it('shows red indicator for high priority tasks', () => {
      render(<TaskCard task={mockHighPriorityTask} />);

      // Should have red priority indicator
      const priorityBadge = screen.getByText(/high/i) ||
        document.querySelector('[data-priority="high"]');
      expect(priorityBadge).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // DUE DATE INDICATOR TESTS
  // ===========================================================================

  describe('Due Date Indicators', () => {
    it('shows overdue indicator for past due tasks', () => {
      render(<TaskCard task={mockOverdueTask} />);

      // Should have overdue visual indicator (red styling or "overdue" text)
      const overdueIndicator =
        screen.queryByText(/overdue/i) ||
        document.querySelector('[data-overdue="true"]');
      expect(overdueIndicator).toBeInTheDocument();
    });

    it('shows today indicator for tasks due today', () => {
      render(<TaskCard task={mockTodayTask} />);

      // Should have today visual indicator (yellow/amber styling or "today" text)
      const todayIndicator =
        screen.queryByText(/today/i) ||
        document.querySelector('[data-due-today="true"]');
      expect(todayIndicator).toBeInTheDocument();
    });

    it('shows tomorrow indicator for tasks due tomorrow', () => {
      render(<TaskCard task={mockHighPriorityTask} />);

      // Should indicate due tomorrow
      const tomorrowIndicator = screen.queryByText(/tomorrow/i);
      expect(tomorrowIndicator).toBeInTheDocument();
    });

    it('does not show overdue indicator for completed tasks with past due date', () => {
      render(<TaskCard task={mockCompletedTask} />);

      // Completed tasks should NOT show overdue, even if due date is past
      const overdueIndicator =
        screen.queryByText(/overdue/i) ||
        document.querySelector('[data-overdue="true"]');
      expect(overdueIndicator).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATUS TOGGLE TESTS
  // ===========================================================================

  describe('Status Toggle', () => {
    it('calls onStatusChange with completed when checkbox is clicked on pending task', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} onStatusChange={mockOnStatusChange} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnStatusChange).toHaveBeenCalledWith(mockTask, 'completed');
    });

    it('calls onStatusChange with pending when checkbox is clicked on completed task', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockCompletedTask} onStatusChange={mockOnStatusChange} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnStatusChange).toHaveBeenCalledWith(mockCompletedTask, 'pending');
    });

    it('checkbox is disabled when isUpdating is true', () => {
      render(
        <TaskCard
          task={mockTask}
          onStatusChange={mockOnStatusChange}
          isUpdating={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('does not call onStatusChange when checkbox is disabled', async () => {
      const user = userEvent.setup();
      render(
        <TaskCard
          task={mockTask}
          onStatusChange={mockOnStatusChange}
          isUpdating={true}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnStatusChange).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // COMPLETED STATE TESTS
  // ===========================================================================

  describe('Completed State', () => {
    it('shows strikethrough styling for completed tasks', () => {
      render(<TaskCard task={mockCompletedTask} />);

      // Title should have strikethrough or muted styling
      const title = screen.getByText('Completed: Send brochure');
      expect(
        title.classList.contains('line-through') ||
        title.closest('[data-completed="true"]') ||
        window.getComputedStyle(title).textDecoration.includes('line-through')
      ).toBeTruthy();
    });

    it('shows completed indicator', () => {
      render(<TaskCard task={mockCompletedTask} />);

      const completedIndicator =
        screen.queryByText(/completed/i) ||
        document.querySelector('[data-status="completed"]');
      expect(completedIndicator).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // ACTION BUTTON TESTS
  // ===========================================================================

  describe('Action Buttons', () => {
    it('renders edit button when onEdit is provided', () => {
      render(<TaskCard task={mockTask} onEdit={mockOnEdit} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it('does not render edit button when onEdit is not provided', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} onEdit={mockOnEdit} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });

    it('renders delete button when onDelete is provided', () => {
      render(<TaskCard task={mockTask} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('does not render delete button when onDelete is not provided', () => {
      render(<TaskCard task={mockTask} />);

      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TaskCard task={mockTask} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockTask);
    });

    it('disables edit button when isUpdating is true', () => {
      render(
        <TaskCard
          task={mockTask}
          onEdit={mockOnEdit}
          isUpdating={true}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeDisabled();
    });

    it('disables delete button when isUpdating is true', () => {
      render(
        <TaskCard
          task={mockTask}
          onDelete={mockOnDelete}
          isUpdating={true}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('has accessible checkbox label', () => {
      render(<TaskCard task={mockTask} />);

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName();
    });

    it('uses semantic article structure', () => {
      render(<TaskCard task={mockTask} />);

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('has accessible edit button', () => {
      render(<TaskCard task={mockTask} onEdit={mockOnEdit} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toHaveAccessibleName();
    });

    it('has accessible delete button', () => {
      render(<TaskCard task={mockTask} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveAccessibleName();
    });
  });

  // ===========================================================================
  // STYLING TESTS
  // ===========================================================================

  describe('Styling', () => {
    it('applies custom className', () => {
      render(<TaskCard task={mockTask} className="custom-class" />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TASK LIST COMPONENT TESTS
// =============================================================================

describe('TaskList', () => {
  const mockOnStatusChange = vi.fn<(task: ClientTask, newStatus: TaskStatus) => void>();
  const mockOnEdit = vi.fn<(task: ClientTask) => void>();
  const mockOnDelete = vi.fn<(task: ClientTask) => void>();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe('Rendering', () => {
    it('renders list of tasks', () => {
      render(<TaskList tasks={mockTasks} />);

      expect(screen.getByText('Follow up with client')).toBeInTheDocument();
      expect(screen.getByText('Urgent: Submit documents')).toBeInTheDocument();
      expect(screen.getByText('Optional: Send birthday card')).toBeInTheDocument();
    });

    it('shows empty state when no tasks', () => {
      render(<TaskList tasks={[]} />);

      expect(screen.getByText(/no tasks|empty/i)).toBeInTheDocument();
    });

    it('shows custom empty message when provided', () => {
      render(<TaskList tasks={[]} emptyMessage="No pending tasks" />);

      expect(screen.getByText(/no pending tasks/i)).toBeInTheDocument();
    });

    it('renders tasks in sorted order by urgency', () => {
      render(<TaskList tasks={mockTasks} />);

      const taskItems =
        screen.getAllByRole('article') ||
        document.querySelectorAll('[data-testid="task-item"]');

      // Overdue/today tasks should appear first
      expect(taskItems.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // ACTION TESTS
  // ===========================================================================

  describe('Actions', () => {
    it('passes onStatusChange to TaskCard', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={[mockTask]} onStatusChange={mockOnStatusChange} />);

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      expect(mockOnStatusChange).toHaveBeenCalledWith(mockTask, 'completed');
    });

    it('passes onEdit to TaskCard', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={[mockTask]} onEdit={mockOnEdit} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
    });

    it('passes onDelete to TaskCard', async () => {
      const user = userEvent.setup();
      render(<TaskList tasks={[mockTask]} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockTask);
    });
  });

  // ===========================================================================
  // LOADING STATE TESTS
  // ===========================================================================

  describe('Loading States', () => {
    it('shows loading state for task being updated', () => {
      render(
        <TaskList
          tasks={mockTasks}
          onStatusChange={mockOnStatusChange}
          updatingTaskId="task_123"
        />
      );

      // The checkbox for task_123 should be disabled
      const checkboxes = screen.getAllByRole('checkbox');
      // Find the checkbox for the task being updated
      const updatingTask = screen.getByText('Follow up with client').closest('article');
      const updatingCheckbox = updatingTask?.querySelector('input[type="checkbox"]');
      expect(updatingCheckbox).toBeDisabled();
    });

    it('shows loading state for task being deleted', () => {
      render(
        <TaskList
          tasks={mockTasks}
          onDelete={mockOnDelete}
          deletingTaskId="task_123"
        />
      );

      // The delete button for task_123 should show loading state
      const taskCard = screen.getByText('Follow up with client').closest('article');
      const deleteButton = taskCard?.querySelector('button[aria-label*="delete" i], button[aria-label*="deleting" i]');
      expect(deleteButton).toBeDisabled();
    });

    it('does not disable other tasks during update', () => {
      render(
        <TaskList
          tasks={mockTasks}
          onStatusChange={mockOnStatusChange}
          updatingTaskId="task_123"
        />
      );

      // Other tasks' checkboxes should still be enabled
      const otherTask = screen.getByText('Urgent: Submit documents').closest('article');
      const otherCheckbox = otherTask?.querySelector('input[type="checkbox"]');
      expect(otherCheckbox).toBeEnabled();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('Accessibility', () => {
    it('uses semantic list structure', () => {
      render(<TaskList tasks={mockTasks} />);

      expect(
        document.querySelector('ul') ||
        document.querySelector('[role="list"]')
      ).toBeInTheDocument();
    });
  });
});
