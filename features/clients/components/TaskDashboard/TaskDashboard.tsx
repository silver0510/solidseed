/**
 * TaskDashboard Component
 *
 * Displays all tasks across all clients in a single table with filtering capabilities.
 * Supports filtering by status, priority, and due date.
 *
 * @module features/clients/components/TaskDashboard/TaskDashboard
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  PlusIcon,
  AlertCircleIcon,
  Loader2Icon,
  CircleIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowUpDownIcon,
  LayoutListIcon,
  LayoutGridIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAllTasks } from '../../hooks/useAllTasks';
import { getTaskDisplayInfo, formatRelativeTime, formatDate, isPast, isToday } from '../../helpers';
import type { TaskWithClient, TaskStatus, TaskPriority } from '../../types';
import { KanbanView } from './KanbanView';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TaskDashboard component
 */
export interface TaskDashboardProps {
  /** Callback when a task is clicked */
  onTaskClick?: (task: TaskWithClient) => void;
  /** Callback when Add Task button is clicked */
  onAddTask?: () => void;
  /** Callback when edit button is clicked */
  onEdit?: (task: TaskWithClient) => void;
  /** Callback when delete button is clicked */
  onDelete?: (task: TaskWithClient) => void;
  /** Additional CSS classes */
  className?: string;
}

type DueDateFilter = 'all' | 'overdue' | 'today' | 'upcoming';
type SortField = 'task' | 'client' | 'priority' | 'status' | 'due_date';
type SortDirection = 'asc' | 'desc' | null;
type ViewMode = 'list' | 'kanban';

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    icon: CircleIcon,
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-300 dark:border-slate-600',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircleIcon,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-600',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle2Icon,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-600',
  },
} as const;

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const STATUS_OPTIONS: Array<{ value: TaskStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const DUE_DATE_OPTIONS: Array<{ value: DueDateFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
];

// =============================================================================
// ICONS - Using lucide-react (ClipboardList)
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

const ClipboardListIcon = ClipboardList;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get priority label
 */
function getPriorityLabel(priority: TaskWithClient['priority']): string {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Unknown';
  }
}

/**
 * Format due date for display
 */
function formatDueDate(
  dueDate: string,
  displayInfo: ReturnType<typeof getTaskDisplayInfo>
): string {
  if (displayInfo.isOverdue) {
    return `Overdue (${formatRelativeTime(dueDate)})`;
  }
  if (displayInfo.isDueToday) {
    return 'Today';
  }
  if (displayInfo.isDueTomorrow) {
    return 'Tomorrow';
  }
  if (displayInfo.daysUntilDue <= 7) {
    return formatRelativeTime(dueDate);
  }
  return formatDate(dueDate);
}

/**
 * Filter tasks by due date
 */
function filterTasksByDueDate(tasks: TaskWithClient[], dueDateFilter: DueDateFilter): TaskWithClient[] {
  if (dueDateFilter === 'all') {
    return tasks;
  }

  return tasks.filter((task) => {
    // Closed tasks are not filtered by due date
    if (task.status === 'closed') {
      return false;
    }

    if (!task.due_date) {
      return false;
    }

    switch (dueDateFilter) {
      case 'overdue':
        return isPast(task.due_date) && !isToday(task.due_date);
      case 'today':
        return isToday(task.due_date);
      case 'upcoming':
        return !isPast(task.due_date) && !isToday(task.due_date);
      default:
        return true;
    }
  });
}

/**
 * Sort tasks by field and direction
 */
function sortTasks(
  tasks: TaskWithClient[],
  sortField: SortField | null,
  sortDirection: SortDirection
): TaskWithClient[] {
  if (!sortField || !sortDirection) {
    return tasks;
  }

  const sorted = [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'task':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'client':
        comparison = a.client_name.localeCompare(b.client_name);
        break;
      case 'priority': {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      }
      case 'status': {
        const statusOrder = { todo: 1, in_progress: 2, closed: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      }
      case 'due_date': {
        // Handle null dates - put them at the end
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        break;
      }
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Task dashboard with single table view and comprehensive filtering
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
  onAddTask,
  onEdit,
  onDelete,
  className,
}) => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Fetch tasks with hook
  const {
    tasks,
    overdueTasksCount,
    todayTasksCount,
    upcomingTasksCount,
    isLoading,
    updateTaskStatus,
  } = useAllTasks({ status: statusFilter, priority: priorityFilter });

  // Filter tasks by due date and apply sorting
  const filteredTasks = useMemo(() => {
    const filtered = filterTasksByDueDate(tasks, dueDateFilter);
    return sortTasks(filtered, sortField, sortDirection);
  }, [tasks, dueDateFilter, sortField, sortDirection]);

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

  const handleRowClick = (e: React.MouseEvent, task: TaskWithClient) => {
    // Don't trigger row click if clicking on the status dropdown or action buttons
    const target = e.target as HTMLElement;
    if (target.closest('[data-status-select]') || target.closest('[data-action-button]')) {
      return;
    }
    handleTaskClick(task);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, task: TaskWithClient) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTaskClick(task);
    }
  };

  // Handle task edit
  const handleEdit = useCallback(
    (e: React.MouseEvent, task: TaskWithClient) => {
      e.stopPropagation();
      onEdit?.(task);
    },
    [onEdit]
  );

  // Handle task delete
  const handleDelete = useCallback(
    async (e: React.MouseEvent, task: TaskWithClient) => {
      e.stopPropagation();
      setDeletingTaskId(task.id);
      try {
        await onDelete?.(task);
      } catch (error) {
        console.error('Failed to delete task:', error);
      } finally {
        setDeletingTaskId(null);
      }
    },
    [onDelete]
  );

  // Handle column sort
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction or clear sort
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // New field, start with ascending
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Get sort icon for column
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDownIcon className="h-3.5 w-3.5 opacity-40" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUpIcon className="h-3.5 w-3.5" />;
    }
    return <ArrowDownIcon className="h-3.5 w-3.5" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar with Filters */}
      <div className="flex flex-col sm:flex-row gap-2 p-2 bg-muted/50 rounded-lg">
        {/* Task Count Summary */}
        <div className="flex items-center gap-2 flex-1">
          <Badge variant="destructive" className="text-xs">
            {overdueTasksCount} overdue
          </Badge>
          <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            {todayTasksCount} today
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {upcomingTasksCount} upcoming
          </Badge>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-9 rounded-none px-3"
              aria-label="List view"
            >
              <LayoutListIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="h-9 rounded-none px-3"
              aria-label="Kanban view"
            >
              <LayoutGridIcon className="h-4 w-4" />
            </Button>
          </div>
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[120px] h-9" aria-label="Filter by status">
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
            <SelectTrigger className="w-full sm:w-[120px] h-9" aria-label="Filter by priority">
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

          {/* Due Date Filter */}
          <Select
            value={dueDateFilter}
            onValueChange={(value) => setDueDateFilter(value as DueDateFilter)}
          >
            <SelectTrigger className="w-full sm:w-[120px] h-9" aria-label="Filter by due date">
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              {DUE_DATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add Task Button */}
          {onAddTask && (
            <Button onClick={onAddTask} variant="outline" size="sm" className="h-9 shrink-0">
              <PlusIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <SpinnerIcon />
          <p className="mt-4 text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardListIcon className="text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No tasks found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter === 'todo'
              ? 'You have no tasks to do. Great job!'
              : statusFilter === 'in_progress'
                ? 'No tasks currently in progress.'
                : statusFilter === 'closed'
                  ? 'No closed tasks found.'
                  : 'No tasks match your current filters.'}
          </p>
        </div>
      )}

      {/* Kanban View */}
      {!isLoading && filteredTasks.length > 0 && viewMode === 'kanban' && (
        <KanbanView
          tasks={filteredTasks}
          onTaskClick={handleTaskClick}
          onStatusChange={handleStatusChange}
          updatingTaskId={updatingTaskId}
        />
      )}

      {/* Task Table */}
      {!isLoading && filteredTasks.length > 0 && viewMode === 'list' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left w-auto">
                    <button
                      onClick={() => handleSort('task')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                        sortField === 'task' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      Task
                      {getSortIcon('task')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-40">
                    <button
                      onClick={() => handleSort('client')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                        sortField === 'client' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      Client
                      {getSortIcon('client')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-24">
                    <button
                      onClick={() => handleSort('priority')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                        sortField === 'priority' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      Priority
                      {getSortIcon('priority')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-32">
                    <button
                      onClick={() => handleSort('status')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                        sortField === 'status' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      Status
                      {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left w-36">
                    <button
                      onClick={() => handleSort('due_date')}
                      className={cn(
                        'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors',
                        sortField === 'due_date' ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      Due Date
                      {getSortIcon('due_date')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right w-24">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filteredTasks.map((task) => {
                  const isUpdating = updatingTaskId === task.id;
                  const isDeleting = deletingTaskId === task.id;
                  const isProcessing = isUpdating || isDeleting;
                  const isClosed = task.status === 'closed';
                  const displayInfo = getTaskDisplayInfo(task);
                  const statusConfig = STATUS_CONFIG[task.status];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr
                      key={task.id}
                      onClick={(e) => handleRowClick(e, task)}
                      onKeyDown={(e) => handleRowKeyDown(e, task)}
                      tabIndex={0}
                      role="button"
                      className={cn(
                        'transition-colors duration-200 hover:bg-muted/50 cursor-pointer',
                        isProcessing && 'opacity-50'
                      )}
                    >
                      {/* Task Title */}
                      <td className="px-4 py-3">
                        <p
                          className={cn(
                            'text-sm text-foreground',
                            isClosed && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </p>
                      </td>

                      {/* Client Name */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {task.client_name}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                            task.priority === 'high' &&
                              'bg-red-500/10 text-red-700 dark:text-red-400',
                            task.priority === 'medium' &&
                              'bg-amber-500/10 text-amber-700 dark:text-amber-400',
                            task.priority === 'low' &&
                              'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          )}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3" data-status-select>
                        {isUpdating ? (
                          <div className="h-8 w-28 flex items-center justify-center">
                            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <Select
                            value={task.status}
                            onValueChange={(value: string) =>
                              handleStatusChange(task, value as TaskStatus)
                            }
                            disabled={!updateTaskStatus}
                          >
                            <SelectTrigger
                              className={cn(
                                'h-8 w-28 text-xs font-medium border',
                                statusConfig.bgColor,
                                statusConfig.textColor,
                                statusConfig.borderColor
                              )}
                              aria-label={`Change task "${task.title}" status`}
                            >
                              <SelectValue>
                                <div className="flex items-center gap-1.5">
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  <span>{statusConfig.label}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.entries(STATUS_CONFIG) as [
                                  TaskStatus,
                                  typeof statusConfig,
                                ][]
                              ).map(([status, config]) => {
                                const Icon = config.icon;
                                return (
                                  <SelectItem key={status} value={status}>
                                    <div className="flex items-center gap-2">
                                      <Icon className={cn('h-4 w-4', config.textColor)} />
                                      <span>{config.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-sm whitespace-nowrap',
                            isClosed
                              ? 'text-muted-foreground'
                              : displayInfo.isOverdue
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : displayInfo.isDueToday
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-muted-foreground'
                          )}
                        >
                          {!isClosed && displayInfo.isOverdue && (
                            <AlertCircleIcon className="h-4 w-4" />
                          )}
                          <time dateTime={task.due_date}>
                            {formatDueDate(task.due_date, displayInfo)}
                          </time>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" data-action-button>
                          {onEdit && (
                            <button
                              type="button"
                              onClick={(e) => handleEdit(e, task)}
                              disabled={isProcessing}
                              aria-label="Edit task"
                              className={cn(
                                'p-1.5 rounded transition-colors',
                                'text-muted-foreground hover:text-foreground hover:bg-muted',
                                isProcessing && 'cursor-not-allowed opacity-50'
                              )}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, task)}
                              disabled={isProcessing}
                              aria-label="Delete task"
                              className={cn(
                                'p-1.5 rounded transition-colors',
                                'text-destructive/70 hover:text-destructive hover:bg-destructive/10',
                                isProcessing && 'cursor-not-allowed opacity-50'
                              )}
                            >
                              {isDeleting ? (
                                <Loader2Icon className="h-4 w-4 animate-spin" />
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TaskDashboard;
