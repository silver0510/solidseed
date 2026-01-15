/**
 * useAllTasks Hook
 *
 * Fetches and manages all tasks across all clients for the task dashboard.
 * Provides filtering, grouping, and status update functionality.
 *
 * @module features/clients/hooks/useAllTasks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { taskApi } from '../api/clientApi';
import { isPast, isToday } from '../helpers';
import type { TaskWithClient, TaskStatus, TaskPriority, TaskFilters } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Options for the useAllTasks hook
 */
export interface UseAllTasksOptions {
  /** Filter by status */
  status?: TaskStatus | 'all';
  /** Filter by priority */
  priority?: TaskPriority | 'all';
}

/**
 * Return value from the useAllTasks hook
 */
export interface UseAllTasksReturn {
  /** Array of all tasks with client info */
  tasks: TaskWithClient[];
  /** Count of overdue tasks */
  overdueTasksCount: number;
  /** Count of tasks due today */
  todayTasksCount: number;
  /** Count of upcoming tasks */
  upcomingTasksCount: number;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Refetch all tasks */
  refetch: () => Promise<void>;
  /** Update a task's status */
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Filter tasks by status and priority
 */
function filterTasks(
  tasks: TaskWithClient[],
  statusFilter: TaskStatus | 'all',
  priorityFilter: TaskPriority | 'all'
): TaskWithClient[] {
  return tasks.filter((task) => {
    // Filter by status
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }
    // Filter by priority
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false;
    }
    return true;
  });
}

/**
 * Count tasks by category
 */
function countTasksByCategory(tasks: TaskWithClient[]) {
  let overdueCount = 0;
  let todayCount = 0;
  let upcomingCount = 0;

  for (const task of tasks) {
    if (task.status === 'completed') continue;

    if (task.due_date && isPast(task.due_date) && !isToday(task.due_date)) {
      overdueCount++;
    } else if (task.due_date && isToday(task.due_date)) {
      todayCount++;
    } else if (task.due_date) {
      upcomingCount++;
    }
  }

  return { overdueCount, todayCount, upcomingCount };
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for fetching and managing all tasks for the dashboard
 *
 * @example
 * ```tsx
 * const {
 *   tasks,
 *   overdueTasksCount,
 *   todayTasksCount,
 *   upcomingTasksCount,
 *   isLoading,
 *   refetch,
 *   updateTaskStatus,
 * } = useAllTasks({ status: 'pending', priority: 'all' });
 * ```
 */
export function useAllTasks(options: UseAllTasksOptions = {}): UseAllTasksReturn {
  const { status = 'pending', priority = 'all' } = options;

  const [allTasks, setAllTasks] = useState<TaskWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build filters for the API
      const filters: TaskFilters = {};
      if (status !== 'all') {
        filters.status = status;
      }
      if (priority !== 'all') {
        filters.priority = priority;
      }

      const tasks = await taskApi.getUserTasks(filters);
      setAllTasks(tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      setAllTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, priority]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks client-side based on options
  const filteredTasks = useMemo(() => {
    return filterTasks(allTasks, status, priority);
  }, [allTasks, status, priority]);

  // Count tasks by category (always count from all pending tasks)
  const { overdueCount, todayCount, upcomingCount } = useMemo(() => {
    return countTasksByCategory(allTasks);
  }, [allTasks]);

  // Update a task's status
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    // Find the task to get client_id
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    try {
      // Update via API
      await taskApi.updateTask(task.client_id, taskId, { status: newStatus });

      // Update local state
      setAllTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
              }
            : t
        )
      );
    } catch (error) {
      console.error('Failed to update task status:', error);
      throw error;
    }
  }, [allTasks]);

  return {
    tasks: filteredTasks,
    overdueTasksCount: overdueCount,
    todayTasksCount: todayCount,
    upcomingTasksCount: upcomingCount,
    isLoading,
    refetch: fetchTasks,
    updateTaskStatus,
  };
}

export default useAllTasks;
