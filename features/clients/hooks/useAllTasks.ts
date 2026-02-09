/**
 * useAllTasks Hook
 *
 * Fetches and manages all tasks across all clients for the task dashboard.
 * Provides filtering, grouping, and status update functionality.
 *
 * @module features/clients/hooks/useAllTasks
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
 * Count tasks by category (excludes closed tasks from counts)
 */
function countTasksByCategory(tasks: TaskWithClient[]) {
  let overdueCount = 0;
  let todayCount = 0;
  let upcomingCount = 0;

  for (const task of tasks) {
    // Exclude closed tasks from date-based counts
    if (task.status === 'closed') continue;

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
 * } = useAllTasks({ status: 'todo', priority: 'all' });
 * ```
 */
export function useAllTasks(options: UseAllTasksOptions = {}): UseAllTasksReturn {
  const { status = 'all', priority = 'all' } = options;
  const queryClient = useQueryClient();

  // Build filters for the API
  const filters: TaskFilters = {};
  if (status !== 'all') {
    filters.status = status;
  }
  if (priority !== 'all') {
    filters.priority = priority;
  }

  // Fetch all tasks using React Query
  // Use a stable base key for all task queries to enable efficient cache updates
  const baseQueryKey = ['tasks', 'all'] as const;
  const queryKey = filters && Object.keys(filters).length > 0
    ? [...baseQueryKey, filters] as const
    : baseQueryKey;

  const { data: allTasks = [], isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () => taskApi.getUserTasks(filters),
  });

  // Filter tasks client-side based on options
  const filteredTasks = useMemo(() => {
    return filterTasks(allTasks, status, priority);
  }, [allTasks, status, priority]);

  // Count tasks by category (always count from all pending tasks)
  const { overdueCount, todayCount, upcomingCount } = useMemo(() => {
    return countTasksByCategory(allTasks);
  }, [allTasks]);

  // Update a task's status with optimistic updates
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    // Find the task to get client_id
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Helper to update task in a list
    const updateTaskInList = (tasks: TaskWithClient[] | undefined): TaskWithClient[] => {
      if (!tasks) return [];
      return tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, completed_at: newStatus === 'closed' ? new Date().toISOString() : null }
          : t
      );
    };

    // Snapshot previous state for rollback
    const previousData = new Map<readonly unknown[], TaskWithClient[] | undefined>();

    // Get all task query keys from cache and update them optimistically
    const queryCache = queryClient.getQueryCache();
    const taskQueries = queryCache.findAll({ queryKey: baseQueryKey });

    // Optimistic update: immediately update ALL task caches
    for (const query of taskQueries) {
      const key = query.queryKey as readonly unknown[];
      previousData.set(key, queryClient.getQueryData<TaskWithClient[]>(key));
      queryClient.setQueryData<TaskWithClient[]>(key, updateTaskInList);
    }

    try {
      // Update via API
      await taskApi.updateTask(task.client_id, taskId, { status: newStatus });

      // No need to invalidate - optimistic update is sufficient
      // Only refetch if data might be stale (e.g., after long idle period)
    } catch (error) {
      // Revert all optimistic updates on error
      for (const [key, data] of previousData) {
        queryClient.setQueryData(key, data);
      }
      console.error('Failed to update task status:', error);
      throw error;
    }
  }, [allTasks, queryClient, baseQueryKey]);

  // Wrapper for refetch to match the expected return type
  const refetchTasks = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    tasks: filteredTasks,
    overdueTasksCount: overdueCount,
    todayTasksCount: todayCount,
    upcomingTasksCount: upcomingCount,
    isLoading,
    refetch: refetchTasks,
    updateTaskStatus,
  };
}

export default useAllTasks;
