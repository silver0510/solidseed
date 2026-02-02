/**
 * TaskGroup Component
 *
 * Collapsible group of tasks with a header showing title and count.
 * Uses table layout for displaying tasks with client name column.
 *
 * @module features/clients/components/TaskDashboard/TaskGroup
 */

import React, { useState } from 'react';
import {
  AlertCircleIcon,
  Loader2Icon,
  CircleIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
  ChevronDown,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTaskDisplayInfo, formatRelativeTime, formatDate } from '../../helpers';
import type { TaskWithClient, TaskStatus } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TaskGroup component
 */
export interface TaskGroupProps {
  /** Group title (e.g., "Overdue", "Today", "Upcoming") */
  title: string;
  /** Tasks in this group */
  tasks: TaskWithClient[];
  /** Callback when task status is changed */
  onStatusChange?: (task: TaskWithClient, newStatus: TaskStatus) => void;
  /** Callback when task is clicked */
  onTaskClick?: (task: TaskWithClient) => void;
  /** ID of task currently being updated */
  updatingTaskId?: string;
  /** Whether the group is expanded by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

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
// ICONS - Using lucide-react
// =============================================================================

const ChevronDownIcon = ChevronDown;
const AlertTriangleIcon = AlertTriangle;
const ClockIcon = Clock;
const CalendarIcon = Calendar;
const CheckCircleIconSvg = CheckCircle2;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get the icon for a group based on its title
 */
function getGroupIcon(title: string) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('overdue')) {
    return <AlertTriangleIcon className="w-4 h-4" />;
  }
  if (lowerTitle.includes('today')) {
    return <ClockIcon className="w-4 h-4" />;
  }
  if (lowerTitle.includes('completed') || lowerTitle.includes('closed')) {
    return <CheckCircleIconSvg className="w-4 h-4" />;
  }
  return <CalendarIcon className="w-4 h-4" />;
}

/**
 * Get CSS classes for group header based on title
 */
function getGroupHeaderClasses(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('overdue')) {
    return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30';
  }
  if (lowerTitle.includes('today')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30';
  }
  if (lowerTitle.includes('completed') || lowerTitle.includes('closed')) {
    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30';
  }
  return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
}

/**
 * Get CSS classes for badge based on title
 */
function getBadgeClasses(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('overdue')) {
    return 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200';
  }
  if (lowerTitle.includes('today')) {
    return 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200';
  }
  if (lowerTitle.includes('completed') || lowerTitle.includes('closed')) {
    return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
  }
  return 'bg-secondary text-secondary-foreground';
}

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

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Collapsible task group with table layout
 *
 * @example
 * ```tsx
 * <TaskGroup
 *   title="Overdue"
 *   tasks={overdueTasks}
 *   onStatusChange={(task, status) => updateTask(task.id, status)}
 *   defaultExpanded={true}
 * />
 * ```
 */
export const TaskGroup: React.FC<TaskGroupProps> = ({
  title,
  tasks,
  onStatusChange,
  onTaskClick,
  updatingTaskId,
  defaultExpanded = true,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const taskCount = tasks.length;

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleStatusChange = (task: TaskWithClient, newStatus: TaskStatus) => {
    onStatusChange?.(task, newStatus);
  };

  const handleTaskClick = (task: TaskWithClient) => {
    onTaskClick?.(task);
  };

  const handleRowClick = (e: React.MouseEvent, task: TaskWithClient) => {
    // Don't trigger row click if clicking on the status dropdown
    const target = e.target as HTMLElement;
    if (target.closest('[data-status-select]')) {
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

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Group Header */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={`task-group-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={cn(
          'w-full flex items-center justify-between p-3 border-b',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          getGroupHeaderClasses(title)
        )}
      >
        <div className="flex items-center gap-2">
          {getGroupIcon(title)}
          <span className="font-semibold text-sm">{title}</span>
          <span
            className={cn(
              'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
              getBadgeClasses(title)
            )}
          >
            {taskCount}
          </span>
        </div>
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-200',
            isExpanded ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>

      {/* Task Table */}
      <div
        id={`task-group-${title.toLowerCase().replace(/\s+/g, '-')}`}
        role="region"
        aria-label={`${title} task list`}
        className={cn(
          'transition-all duration-200',
          isExpanded ? 'max-h-card-expanded opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        {taskCount > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-36">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {tasks.map((task) => {
                  const isUpdating = updatingTaskId === task.id;
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
                        isUpdating && 'opacity-50'
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
                            disabled={!onStatusChange}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            No tasks in this group
          </CardContent>
        )}
      </div>
    </Card>
  );
};

export default TaskGroup;
