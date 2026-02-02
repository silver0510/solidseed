/**
 * TaskList Component
 *
 * Displays a list of tasks sorted by urgency with empty state.
 *
 * @module features/clients/components/TaskCard/TaskList
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { ClipboardList } from 'lucide-react';
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
// ICONS - Using lucide-react
// =============================================================================

const ClipboardListIcon = ClipboardList;

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
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Status
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
