/**
 * TasksTab Component
 *
 * Displays task list for a client with status toggle.
 *
 * @module features/clients/components/ClientProfile/TasksTab
 */

import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { TaskList } from '../TaskCard';
import { taskApi } from '../../api/clientApi';
import type { ClientTask, TaskStatus } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TasksTab component
 */
export interface TasksTabProps {
  /** Client ID */
  clientId: string;
  /** Array of tasks to display */
  tasks: ClientTask[];
  /** Callback when a task is created or modified */
  onTaskChanged?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client tasks tab with list and status management
 *
 * @example
 * ```tsx
 * <TasksTab
 *   clientId="cl123"
 *   tasks={tasks}
 *   onTaskChanged={refetchTasks}
 * />
 * ```
 */
export const TasksTab: React.FC<TasksTabProps> = ({
  clientId,
  tasks,
  onTaskChanged,
  className,
}) => {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Handle task status change
  const handleStatusChange = useCallback(
    async (task: ClientTask, newStatus: TaskStatus) => {
      setUpdatingTaskId(task.id);
      try {
        if (newStatus === 'completed') {
          await taskApi.completeTask(clientId, task.id);
        } else {
          await taskApi.uncompleteTask(clientId, task.id);
        }
        onTaskChanged?.();
      } catch (error) {
        console.error('Failed to update task status:', error);
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [clientId, onTaskChanged]
  );

  // Handle task edit (placeholder - would typically open a modal)
  const handleEdit = useCallback((task: ClientTask) => {
    // TODO: Implement task editing modal
    console.log('Edit task:', task.id);
  }, []);

  // Handle task deletion
  const handleDelete = useCallback(
    async (task: ClientTask) => {
      setDeletingTaskId(task.id);
      try {
        await taskApi.deleteTask(clientId, task.id);
        onTaskChanged?.();
      } catch (error) {
        console.error('Failed to delete task:', error);
      } finally {
        setDeletingTaskId(null);
      }
    },
    [clientId, onTaskChanged]
  );

  // Count pending and completed tasks
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Task Summary */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{pendingCount} pending</span>
          <span className="text-gray-300">|</span>
          <span>{completedCount} completed</span>
        </div>
      )}

      {/* Task List */}
      <TaskList
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        updatingTaskId={updatingTaskId ?? undefined}
        deletingTaskId={deletingTaskId ?? undefined}
      />
    </div>
  );
};

export default TasksTab;
