/**
 * TaskCard Component
 *
 * Displays a task with color-coded priority, due date indicators,
 * and status toggle functionality.
 *
 * @module features/clients/components/TaskCard/TaskCard
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
// ICONS (inline SVG to avoid external dependencies)
// =============================================================================

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent',
      className
    )}
    role="status"
    aria-label="Loading"
  />
);

const EditIcon = ({ className }: { className?: string }) => (
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
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
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
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

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
    <Card
      data-testid="task-item"
      data-completed={isCompleted || undefined}
      data-overdue={displayInfo.isOverdue || undefined}
      data-due-today={displayInfo.isDueToday || undefined}
      data-priority={task.priority}
      data-status={task.status}
      className={cn(
        // Base styles
        'transition-all duration-200',
        // Status-based styling
        isCompleted && 'bg-muted/50',
        // Urgency-based styling (only for pending tasks)
        !isCompleted && displayInfo.isOverdue && 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10',
        !isCompleted && displayInfo.isDueToday && 'border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/10',
        // Updating state
        isUpdating && 'opacity-50',
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status Checkbox */}
          <div className="flex-shrink-0 pt-0.5">
            <label className="relative flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={handleStatusToggle}
                disabled={isUpdating || !onStatusChange}
                aria-label={`Mark task "${task.title}" as ${isCompleted ? 'pending' : 'completed'}`}
                className="sr-only peer"
              />
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center',
                  'transition-all duration-150',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-ring',
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white dark:bg-green-600 dark:border-green-600'
                    : 'border-input hover:border-muted-foreground',
                  isUpdating && 'cursor-not-allowed',
                  !isUpdating && !isCompleted && 'hover:bg-muted'
                )}
              >
                {isUpdating ? (
                  <SpinnerIcon className="text-muted-foreground" />
                ) : isCompleted ? (
                  <CheckIcon className="w-3.5 h-3.5" />
                ) : null}
              </div>
            </label>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header row with title and badges */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3
                  className={cn(
                    'text-sm font-medium text-foreground break-words',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {task.title}
                </h3>
              </div>

              {/* Action buttons - desktop */}
              <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(task)}
                    disabled={isUpdating}
                    aria-label="Edit task"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <EditIcon />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task)}
                    disabled={isUpdating}
                    aria-label="Delete task"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  >
                    <TrashIcon />
                  </Button>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p
                className={cn(
                  'text-sm text-muted-foreground mb-2 break-words',
                  isCompleted && 'text-muted-foreground/60'
                )}
              >
                {task.description}
              </p>
            )}

            {/* Footer row with badges and due date */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Priority badge */}
              <Badge
                variant={getPriorityVariant(task.priority)}
                data-priority={task.priority}
                className="text-xs"
              >
                {getPriorityLabel(task.priority)}
              </Badge>

              {/* Completed badge */}
              {isCompleted && (
                <Badge
                  variant="outline"
                  data-status="completed"
                  className="text-xs bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                >
                  Completed
                </Badge>
              )}

              {/* Due date */}
              <span
                role="time"
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  isCompleted
                    ? 'text-muted-foreground/60'
                    : displayInfo.isOverdue
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : displayInfo.isDueToday
                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                        : 'text-muted-foreground'
                )}
              >
                {!isCompleted && displayInfo.isOverdue ? (
                  <AlertCircleIcon className="w-3.5 h-3.5" />
                ) : (
                  <CalendarIcon className="w-3.5 h-3.5" />
                )}
                <time dateTime={task.due_date}>
                  {formatDueDate(task.due_date, displayInfo)}
                </time>
              </span>
            </div>

            {/* Mobile action buttons */}
            {(onEdit || onDelete) && (
              <div className="flex sm:hidden items-center gap-1 mt-3 pt-3 border-t border-border">
                {onEdit && (
                  <Button
                    variant="ghost"
                    onClick={() => onEdit(task)}
                    disabled={isUpdating}
                    aria-label="Edit task"
                    className="flex-1 h-11 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <EditIcon className="mr-1.5" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    onClick={() => onDelete(task)}
                    disabled={isUpdating}
                    aria-label="Delete task"
                    className="flex-1 h-11 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <TrashIcon className="mr-1.5" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
