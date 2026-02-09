/**
 * TaskList Component
 *
 * Displays a list of tasks sorted by urgency with empty state.
 *
 * @module features/clients/components/TaskCard/TaskList
 */

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { ClipboardList, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { sortTasksByUrgency } from '../../helpers';
import { TaskCard } from './TaskCard';
import type { ClientTask, TaskStatus, TaskPriority } from '../../types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// =============================================================================
// TYPES
// =============================================================================

type SortField = 'title' | 'priority' | 'status' | 'due_date' | 'updated_at' | 'default';
type SortDirection = 'asc' | 'desc' | null;

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
  /** Whether to show the hide closed tasks checkbox (default: true) */
  hideClosedTasksCheckbox?: boolean;
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
  hideClosedTasksCheckbox = true,
}) => {
  const [hideClosedTasks, setHideClosedTasks] = useState(false);
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Priority order for sorting
  const priorityOrder: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  // Status order for sorting
  const statusOrder: Record<TaskStatus, number> = {
    todo: 1,
    in_progress: 2,
    closed: 3,
  };

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    // Filter out closed tasks if checkbox is checked
    let filtered = hideClosedTasks
      ? tasks.filter(task => task.status !== 'closed')
      : tasks;

    // Sort tasks
    if (sortField === 'default' || sortDirection === null) {
      // Use default urgency sorting
      return sortTasksByUrgency(filtered);
    }

    // Custom sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'due_date':
          const aDate = new Date(a.due_date).getTime();
          const bDate = new Date(b.due_date).getTime();
          comparison = aDate - bDate;
          break;
        case 'updated_at':
          const aUpdated = new Date(a.updated_at).getTime();
          const bUpdated = new Date(b.updated_at).getTime();
          comparison = aUpdated - bUpdated;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, hideClosedTasks, sortField, sortDirection]);

  // Handle column header click
  const handleSort = (field: SortField) => {
    if (field === 'default') {
      setSortField('default');
      setSortDirection(null);
      return;
    }

    if (sortField === field) {
      // Cycle through: asc -> desc -> default
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField('default');
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1" />;
    }
    return <ArrowDown className="h-3 w-3 ml-1" />;
  };

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

  // All tasks filtered out
  if (processedTasks.length === 0 && hideClosedTasks && hideClosedTasksCheckbox) {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Filter Controls */}
        {hideClosedTasksCheckbox && (
          <div className="flex items-center space-x-2 px-4 py-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="hide-closed"
              checked={hideClosedTasks}
              onCheckedChange={(checked) => setHideClosedTasks(checked === true)}
            />
            <Label htmlFor="hide-closed" className="text-sm font-medium cursor-pointer">
              Hide closed tasks
            </Label>
          </div>
        )}

        {/* Empty state for filtered view */}
        <div className="w-full rounded-lg border border-border bg-card p-8">
          <div className="flex flex-col items-center justify-center py-4">
            <ClipboardListIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">All tasks are closed</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Uncheck &quot;Hide closed tasks&quot; to see them</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Controls */}
      {hideClosedTasksCheckbox && (
        <div className="flex items-center space-x-2 px-4 py-3 bg-muted/50 rounded-lg">
          <Checkbox
            id="hide-closed"
            checked={hideClosedTasks}
            onCheckedChange={(checked) => setHideClosedTasks(checked === true)}
          />
          <Label htmlFor="hide-closed" className="text-sm font-medium cursor-pointer">
            Hide closed tasks
          </Label>
        </div>
      )}

      {/* Tasks Table */}
      <div className="w-full rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Task
                    {renderSortIcon('title')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center">
                    Priority
                    {renderSortIcon('priority')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('due_date')}
                >
                  <div className="flex items-center">
                    Due Date
                    {renderSortIcon('due_date')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSort('updated_at')}
                >
                  <div className="flex items-center">
                    Updated At
                    {renderSortIcon('updated_at')}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processedTasks.map((task) => {
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
    </div>
  );
};

export default TaskList;
