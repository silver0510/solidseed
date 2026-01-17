/**
 * TaskDashboard Component
 *
 * Displays all tasks across all clients with filtering and grouping capabilities.
 * Tasks are grouped by due date: Overdue, Today, Upcoming, and Completed.
 *
 * @module features/clients/components/TaskDashboard/TaskDashboard
 */

import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskGroup } from './TaskGroup';
import { useAllTasks } from '../../hooks/useAllTasks';
import { isPast, isToday } from '../../helpers';
import type { TaskWithClient, TaskStatus, TaskPriority } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TaskDashboard component
 */
export interface TaskDashboardProps {
  /** Callback when a task is clicked */
  onTaskClick?: (task: TaskWithClient) => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS (inline SVG)
// =============================================================================

const SpinnerIcon = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary',
      className
    )}
    role="status"
    aria-label="Loading tasks"
  />
);

const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const STATUS_OPTIONS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// =============================================================================
// HELPERS
// =============================================================================

interface GroupedTasks {
  overdue: TaskWithClient[];
  today: TaskWithClient[];
  upcoming: TaskWithClient[];
  noDueDate: TaskWithClient[];
  completed: TaskWithClient[];
}

/**
 * Group tasks by due date category
 */
function groupTasksByDueDate(tasks: TaskWithClient[]): GroupedTasks {
  const groups: GroupedTasks = {
    overdue: [],
    today: [],
    upcoming: [],
    noDueDate: [],
    completed: [],
  };

  for (const task of tasks) {
    if (task.status === 'completed') {
      groups.completed.push(task);
    } else if (!task.due_date) {
      groups.noDueDate.push(task);
    } else if (isToday(task.due_date)) {
      groups.today.push(task);
    } else if (isPast(task.due_date)) {
      groups.overdue.push(task);
    } else {
      groups.upcoming.push(task);
    }
  }

  return groups;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Task dashboard with filtering and grouping
 *
 * @example
 * ```tsx
 * <TaskDashboard
 *   onTaskClick={(task) => openTaskModal(task)}
 * />
 * ```
 */
export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  onTaskClick,
  className,
}) => {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('pending');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Fetch tasks with hook
  const {
    tasks,
    overdueTasksCount,
    todayTasksCount,
    upcomingTasksCount,
    isLoading,
    updateTaskStatus,
  } = useAllTasks({ status: statusFilter, priority: priorityFilter });

  // Group tasks by due date
  const groupedTasks = useMemo(() => groupTasksByDueDate(tasks), [tasks]);

  // Handle status change
  const handleStatusChange = useCallback(
    async (task: TaskWithClient, newStatus: TaskStatus) => {
      setUpdatingTaskId(task.id);
      try {
        await updateTaskStatus(task.id, newStatus);
      } catch (error) {
        console.error('Failed to update task status:', error);
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [updateTaskStatus]
  );

  // Handle task click
  const handleTaskClick = useCallback(
    (task: TaskWithClient) => {
      onTaskClick?.(task);
    },
    [onTaskClick]
  );

  // Check if there are any tasks to display
  const hasAnyTasks =
    groupedTasks.overdue.length > 0 ||
    groupedTasks.today.length > 0 ||
    groupedTasks.upcoming.length > 0 ||
    groupedTasks.noDueDate.length > 0 ||
    groupedTasks.completed.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">Task Dashboard</h2>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <FilterIcon className="text-muted-foreground hidden sm:block" />

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[140px] min-h-[44px]" aria-label="Filter by priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Task Count Summary */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Badge variant="destructive" className="font-medium">
          {overdueTasksCount} overdue
        </Badge>
        <Badge variant="outline" className="font-medium bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
          {todayTasksCount} due today
        </Badge>
        <Badge variant="secondary" className="font-medium">
          {upcomingTasksCount} upcoming
        </Badge>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <SpinnerIcon />
          <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasAnyTasks && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardListIcon className="text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No tasks</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter === 'pending'
              ? 'You have no pending tasks. Great job!'
              : statusFilter === 'completed'
                ? 'No completed tasks found.'
                : 'No tasks match your current filters.'}
          </p>
        </div>
      )}

      {/* Task Groups */}
      {!isLoading && hasAnyTasks && (
        <div className="space-y-4">
          {/* Overdue Tasks */}
          {groupedTasks.overdue.length > 0 && (
            <TaskGroup
              title="Overdue"
              tasks={groupedTasks.overdue}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
              updatingTaskId={updatingTaskId || undefined}
              defaultExpanded={true}
            />
          )}

          {/* Today Tasks */}
          {groupedTasks.today.length > 0 && (
            <TaskGroup
              title="Today"
              tasks={groupedTasks.today}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
              updatingTaskId={updatingTaskId || undefined}
              defaultExpanded={true}
            />
          )}

          {/* Upcoming Tasks */}
          {groupedTasks.upcoming.length > 0 && (
            <TaskGroup
              title="Upcoming"
              tasks={groupedTasks.upcoming}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
              updatingTaskId={updatingTaskId || undefined}
              defaultExpanded={true}
            />
          )}

          {/* No Due Date Tasks */}
          {groupedTasks.noDueDate.length > 0 && (
            <TaskGroup
              title="No Due Date"
              tasks={groupedTasks.noDueDate}
              onStatusChange={handleStatusChange}
              onTaskClick={handleTaskClick}
              updatingTaskId={updatingTaskId || undefined}
              defaultExpanded={false}
            />
          )}

          {/* Completed Tasks (only show if status filter includes them) */}
          {(statusFilter === 'completed' || statusFilter === 'all') &&
            groupedTasks.completed.length > 0 && (
              <TaskGroup
                title="Completed"
                tasks={groupedTasks.completed}
                onStatusChange={handleStatusChange}
                onTaskClick={handleTaskClick}
                updatingTaskId={updatingTaskId || undefined}
                defaultExpanded={false}
              />
            )}
        </div>
      )}
    </div>
  );
};

export default TaskDashboard;
