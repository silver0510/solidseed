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
function getPriorityClasses(priority: ClientTask['priority']): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'low':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
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
    <article
      role="article"
      data-testid="task-item"
      data-completed={isCompleted || undefined}
      data-overdue={displayInfo.isOverdue || undefined}
      data-due-today={displayInfo.isDueToday || undefined}
      data-priority={task.priority}
      data-status={task.status}
      className={cn(
        // Base styles
        'rounded-lg border bg-white p-4',
        'transition-all duration-200',
        // Status-based styling
        isCompleted && 'bg-gray-50 border-gray-200',
        // Urgency-based styling (only for pending tasks)
        !isCompleted && displayInfo.isOverdue && 'border-red-300 bg-red-50/30',
        !isCompleted && displayInfo.isDueToday && 'border-amber-300 bg-amber-50/30',
        // Default border
        !isCompleted && !displayInfo.isOverdue && !displayInfo.isDueToday && 'border-gray-200',
        // Updating state
        isUpdating && 'opacity-50',
        className
      )}
    >
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
                'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-blue-500',
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-300 hover:border-gray-400',
                isUpdating && 'cursor-not-allowed opacity-50',
                !isUpdating && !isCompleted && 'hover:bg-gray-50'
              )}
            >
              {isCompleted && <CheckIcon className="w-3.5 h-3.5" />}
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
                  'text-sm font-medium text-gray-900 break-words',
                  isCompleted && 'line-through text-gray-500'
                )}
              >
                {task.title}
              </h3>
            </div>

            {/* Action buttons - desktop */}
            <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  disabled={isUpdating}
                  aria-label="Edit task"
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                    isUpdating && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <EditIcon />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  disabled={isUpdating}
                  aria-label="Delete task"
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'text-red-400 hover:text-red-600 hover:bg-red-50',
                    isUpdating && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p
              className={cn(
                'text-sm text-gray-600 mb-2 break-words',
                isCompleted && 'text-gray-400'
              )}
            >
              {task.description}
            </p>
          )}

          {/* Footer row with badges and due date */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Priority badge */}
            <span
              data-priority={task.priority}
              className={cn(
                'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
                getPriorityClasses(task.priority)
              )}
            >
              {getPriorityLabel(task.priority)}
            </span>

            {/* Completed badge */}
            {isCompleted && (
              <span
                data-status="completed"
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border bg-green-100 text-green-700 border-green-200"
              >
                Completed
              </span>
            )}

            {/* Due date */}
            <span
              role="time"
              className={cn(
                'inline-flex items-center gap-1 text-xs',
                isCompleted
                  ? 'text-gray-400'
                  : displayInfo.isOverdue
                    ? 'text-red-600 font-medium'
                    : displayInfo.isDueToday
                      ? 'text-amber-600 font-medium'
                      : 'text-gray-500'
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
            <div className="flex sm:hidden items-center gap-1 mt-3 pt-3 border-t border-gray-100">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  disabled={isUpdating}
                  aria-label="Edit task"
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg',
                    'text-sm text-gray-600 hover:bg-gray-100 active:bg-gray-200',
                    'min-h-[44px]',
                    isUpdating && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <EditIcon />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  disabled={isUpdating}
                  aria-label="Delete task"
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg',
                    'text-sm text-red-600 hover:bg-red-50 active:bg-red-100',
                    'min-h-[44px]',
                    isUpdating && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <TrashIcon />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default TaskCard;
