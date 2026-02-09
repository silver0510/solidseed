/**
 * TaskCard Component
 *
 * Displays a task with color-coded priority, due date indicators,
 * and status toggle functionality.
 *
 * @module features/clients/components/TaskCard/TaskCard
 */

import React from 'react';
import {
  AlertCircleIcon,
  Loader2Icon,
  PencilIcon,
  TrashIcon,
  CircleIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTaskDisplayInfo, formatRelativeTime, formatDate } from '../../helpers';
import type { ClientTask, TaskStatus } from '../../types';

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================

/**
 * Status configuration for colors and icons
 */
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
// TYPES
// =============================================================================

/**
 * Props for the TaskCard component
 */
export interface TaskCardProps {
  /** The task to display */
  task: ClientTask;
  /** Callback when status toggle is clicked */
  onStatusChange?: (task: ClientTask, newStatus: TaskStatus) => void;
  /** Callback when edit button is clicked */
  onEdit?: (task: ClientTask) => void;
  /** Callback when delete button is clicked */
  onDelete?: (task: ClientTask) => void;
  /** Whether the card is in a loading state */
  isUpdating?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get CSS classes for priority badge
 */
function getPriorityVariant(priority: ClientTask['priority']): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}

/**
 * Get priority label
 */
function getPriorityLabel(priority: ClientTask['priority']): string {
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
 * Task card with priority colors, due date indicators, and status toggle
 *
 * @example
 * ```tsx
 * <TaskCard
 *   task={task}
 *   onStatusChange={(task, newStatus) => updateTask(task.id, { status: newStatus })}
 *   onEdit={(task) => openEditModal(task)}
 *   onDelete={(task) => deleteTask(task.id)}
 *   isUpdating={isUpdating}
 * />
 * ```
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  isUpdating = false,
  className,
}) => {
  const isClosed = task.status === 'closed';
  const displayInfo = getTaskDisplayInfo(task);
  const statusConfig = STATUS_CONFIG[task.status];
  const StatusIcon = statusConfig.icon;

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!onStatusChange || isUpdating) return;
    onStatusChange(task, newStatus);
  };

  return (
    <tr
      data-testid="task-item"
      data-closed={isClosed || undefined}
      data-overdue={displayInfo.isOverdue || undefined}
      data-due-today={displayInfo.isDueToday || undefined}
      data-priority={task.priority}
      data-status={task.status}
      className={cn(
        'transition-opacity duration-200 hover:bg-muted/30',
        isUpdating && 'opacity-50',
        className
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

      {/* Priority */}
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            task.priority === 'high' && 'bg-red-500/10 text-red-700 dark:text-red-400',
            task.priority === 'medium' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
            task.priority === 'low' && 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
          )}
        >
          {getPriorityLabel(task.priority)}
        </span>
      </td>

      {/* Status Dropdown */}
      <td className="px-4 py-3">
        {isUpdating ? (
          <div className="h-8 w-28 flex items-center justify-center">
            <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Select
            value={task.status}
            onValueChange={(value: string) => handleStatusChange(value as TaskStatus)}
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
              {(Object.entries(STATUS_CONFIG) as [TaskStatus, typeof statusConfig][]).map(
                ([status, config]) => {
                  const Icon = config.icon;
                  return (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn('h-4 w-4', config.textColor)} />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  );
                }
              )}
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

      {/* Updated At */}
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          <time dateTime={task.updated_at}>
            {formatRelativeTime(task.updated_at)}
          </time>
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              disabled={isUpdating}
              aria-label="Edit task"
              className={cn(
                'p-1.5 rounded transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-muted',
                isUpdating && 'cursor-not-allowed opacity-50'
              )}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              disabled={isUpdating}
              aria-label="Delete task"
              className={cn(
                'p-1.5 rounded transition-colors',
                'text-destructive/70 hover:text-destructive hover:bg-destructive/10',
                isUpdating && 'cursor-not-allowed opacity-50'
              )}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TaskCard;
