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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getTaskDisplayInfo, formatRelativeTime, formatDate } from '../../helpers';
import type { ClientTask, TaskStatus } from '../../types';

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
  const isCompleted = task.status === 'completed';
  const displayInfo = getTaskDisplayInfo(task);

  const handleStatusToggle = () => {
    if (!onStatusChange || isUpdating) return;
    const newStatus: TaskStatus = isCompleted ? 'pending' : 'completed';
    onStatusChange(task, newStatus);
  };

  return (
    <tr
      data-testid="task-item"
      data-completed={isCompleted || undefined}
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
      {/* Status Checkbox */}
      <td className="px-4 py-3">
        {isUpdating ? (
          <div className="h-5 w-5 flex items-center justify-center">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => handleStatusToggle()}
            disabled={!onStatusChange}
            aria-label={`Mark task "${task.title}" as ${isCompleted ? 'pending' : 'completed'}`}
            className={cn(
              'h-5 w-5 rounded',
              isCompleted && 'bg-green-500 border-green-500 text-white data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 dark:bg-green-600 dark:border-green-600 dark:data-[state=checked]:bg-green-600 dark:data-[state=checked]:border-green-600'
            )}
          />
        )}
      </td>

      {/* Task Title */}
      <td className="px-4 py-3">
        <p
          className={cn(
            'text-sm text-foreground',
            isCompleted && 'line-through text-muted-foreground'
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

      {/* Due Date */}
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1 text-sm whitespace-nowrap',
            isCompleted
              ? 'text-muted-foreground'
              : displayInfo.isOverdue
                ? 'text-red-600 dark:text-red-400 font-medium'
                : displayInfo.isDueToday
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-muted-foreground'
          )}
        >
          {!isCompleted && displayInfo.isOverdue && (
            <AlertCircleIcon className="h-4 w-4" />
          )}
          <time dateTime={task.due_date}>
            {formatDueDate(task.due_date, displayInfo)}
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
