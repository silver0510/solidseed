/**
 * TaskList Component
 *
 * Displays a list of tasks sorted by urgency with empty state.
 *
 * @module features/clients/components/TaskCard/TaskList
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { sortTasksByUrgency } from '../../helpers';
import { TaskCard } from './TaskCard';
import type { ClientTask, TaskStatus } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TaskList component
 */
export interface TaskListProps {
  /** Array of tasks to display */
  tasks: ClientTask[];
  /** Callback when status toggle is clicked */
  onStatusChange?: (task: ClientTask, newStatus: TaskStatus) => void;
  /** Callback when edit button is clicked */
  onEdit?: (task: ClientTask) => void;
  /** Callback when delete button is clicked */
  onDelete?: (task: ClientTask) => void;
  /** Task ID currently being updated (shows loading state) */
  updatingTaskId?: string;
  /** Task ID currently being deleted (shows loading state) */
  deletingTaskId?: string;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS
// =============================================================================

const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
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

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Task list with sorting and empty state
 *
 * @example
 * ```tsx
 * <TaskList
 *   tasks={tasks}
 *   onStatusChange={(task, newStatus) => updateTask(task.id, { status: newStatus })}
 *   onEdit={(task) => openEditModal(task)}
 *   onDelete={(task) => deleteTask(task.id)}
 *   updatingTaskId={updatingTaskId}
 *   deletingTaskId={deletingTaskId}
 * />
 * ```
 */
export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
  updatingTaskId,
  deletingTaskId,
  emptyMessage = 'No tasks yet',
  className,
}) => {
  // Sort tasks by urgency (overdue first, then by due date, then by priority)
  const sortedTasks = sortTasksByUrgency(tasks);

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className={cn('w-full rounded-lg border border-border bg-card p-8', className)}>
        <div className="flex flex-col items-center justify-center py-4">
          <ClipboardListIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Tasks will appear here when added</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">
                Due Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedTasks.map((task) => {
              const isUpdating = updatingTaskId === task.id || deletingTaskId === task.id;

              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isUpdating={isUpdating}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskList;
