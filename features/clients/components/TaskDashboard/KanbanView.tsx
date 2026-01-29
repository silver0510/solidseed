'use client';

/**
 * Kanban View Component
 *
 * Displays tasks organized by status in a kanban board layout using the
 * reusable KanbanBoard component with dnd-kit for drag-and-drop.
 *
 * @module features/clients/components/TaskDashboard/KanbanView
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  AlertCircleIcon,
  CircleIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/card';
import { KanbanBoard, KanbanCard, type KanbanColumn } from '@/components/ui/kanban';
import { getTaskDisplayInfo, formatRelativeTime, formatDate } from '../../helpers';
import type { TaskWithClient, TaskStatus } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface KanbanViewProps {
  /** Array of tasks to display */
  tasks: TaskWithClient[];
  /** Callback when a task is clicked */
  onTaskClick?: (task: TaskWithClient) => void;
  /** Callback to update task status */
  onStatusChange?: (task: TaskWithClient, newStatus: TaskStatus) => Promise<void>;
  /** ID of task currently being updated */
  updatingTaskId?: string | null;
}

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    icon: CircleIcon,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-600',
    columnBg: 'bg-amber-50/50 dark:bg-amber-900/20',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircleIcon,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-600',
    columnBg: 'bg-blue-50/50 dark:bg-blue-900/20',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle2Icon,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-600',
    columnBg: 'bg-green-50/50 dark:bg-green-900/20',
  },
} as const;

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'closed'];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get priority label and color
 */
function getPriorityConfig(priority: TaskWithClient['priority']) {
  const configs = {
    high: {
      label: 'High',
      bgColor: 'bg-red-500/10',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-l-red-500',
    },
    medium: {
      label: 'Medium',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-l-amber-500',
    },
    low: {
      label: 'Low',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-l-blue-500',
    },
  };
  return configs[priority];
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
// TASK CARD COMPONENT
// =============================================================================

interface TaskCardContentProps {
  task: TaskWithClient;
  isUpdating?: boolean;
  isDragging?: boolean;
}

const TaskCardContent: React.FC<TaskCardContentProps> = ({
  task,
  isUpdating = false,
  isDragging = false,
}) => {
  const displayInfo = getTaskDisplayInfo(task);
  const priorityConfig = getPriorityConfig(task.priority);
  const isClosed = task.status === 'closed';

  return (
    <div
      className={cn(
        'space-y-2',
        isUpdating && 'pointer-events-none opacity-50',
        isDragging && 'scale-95 opacity-40'
      )}
    >
      {/* Task Title */}
      <h4
        className={cn(
          'wrap-break-word text-sm font-medium',
          isClosed && 'text-muted-foreground line-through'
        )}
      >
        {task.title}
      </h4>

      {/* Client */}
      <div className="text-xs text-muted-foreground">
        <span className="truncate">{task.client_name}</span>
      </div>

      {/* Priority Badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            priorityConfig.bgColor,
            priorityConfig.textColor
          )}
        >
          {priorityConfig.label}
        </span>
      </div>

      {/* Due Date */}
      <div
        className={cn(
          'flex items-center gap-1 text-xs',
          isClosed
            ? 'text-muted-foreground'
            : displayInfo.isOverdue
              ? 'font-medium text-red-600 dark:text-red-400'
              : displayInfo.isDueToday
                ? 'font-medium text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
        )}
      >
        {!isClosed && displayInfo.isOverdue && (
          <AlertCircleIcon className="h-3.5 w-3.5" />
        )}
        <time dateTime={task.due_date}>{formatDueDate(task.due_date, displayInfo)}</time>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN KANBAN VIEW COMPONENT
// =============================================================================

/**
 * Kanban board view for tasks organized by status
 */
export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  onTaskClick,
  onStatusChange,
  updatingTaskId,
}) => {
  const [optimisticTasks, setOptimisticTasks] = useState<TaskWithClient[]>(tasks);

  // Track the last synced task IDs to prevent unnecessary resets
  const lastSyncedIdsRef = React.useRef<string>('');

  // Update optimistic tasks when props change
  React.useEffect(() => {
    const newIds = tasks
      .map((t) => t.id)
      .sort()
      .join(',');

    if (lastSyncedIdsRef.current !== newIds) {
      lastSyncedIdsRef.current = newIds;
      setOptimisticTasks(tasks);
    }
  }, [tasks]);

  // Build columns for the KanbanBoard
  const columns: KanbanColumn<TaskWithClient>[] = useMemo(() => {
    return STATUS_ORDER.map((status) => {
      const config = STATUS_CONFIG[status];
      const StatusIcon = config.icon;
      const statusTasks = optimisticTasks.filter((t) => t.status === status);

      return {
        id: status,
        title: config.label,
        items: statusTasks,
        icon: <StatusIcon className={cn('h-5 w-5', config.textColor)} />,
        columnClassName: config.columnBg,
      };
    });
  }, [optimisticTasks]);

  // Handle drag end - update task status
  const handleDragEnd = useCallback(
    async (itemId: string, sourceColumnId: string, targetColumnId: string) => {
      const task = optimisticTasks.find((t) => t.id === itemId);
      if (!task) return;

      const newStatus = targetColumnId as TaskStatus;

      // Optimistic update
      setOptimisticTasks((prev) =>
        prev.map((t) => (t.id === itemId ? { ...t, status: newStatus } : t))
      );

      // Call API
      if (onStatusChange) {
        try {
          await onStatusChange(task, newStatus);
        } catch (error) {
          console.error('Failed to update task:', error);
          // Rollback on error
          setOptimisticTasks(tasks);
        }
      }
    },
    [optimisticTasks, onStatusChange, tasks]
  );

  // Handle item click
  const handleItemClick = useCallback(
    (task: TaskWithClient) => {
      if (updatingTaskId === task.id) return;
      onTaskClick?.(task);
    },
    [onTaskClick, updatingTaskId]
  );

  // Render card function for desktop (with dnd-kit sortable)
  const renderCard = useCallback(
    (task: TaskWithClient, isDragging?: boolean) => {
      const priorityConfig = getPriorityConfig(task.priority);
      const isUpdating = updatingTaskId === task.id;

      return (
        <KanbanCard
          id={task.id}
          className={cn(
            'border-l-4',
            priorityConfig.borderColor,
            isUpdating && 'pointer-events-none opacity-50',
            task.status === 'closed' && 'bg-muted/50'
          )}
          showDragHandle
        >
          <TaskCardContent task={task} isUpdating={isUpdating} isDragging={isDragging} />
        </KanbanCard>
      );
    },
    [updatingTaskId]
  );

  // Render overlay (shown while dragging)
  const renderOverlay = useCallback(
    (task: TaskWithClient) => {
      const priorityConfig = getPriorityConfig(task.priority);

      return (
        <Card
          className={cn(
            'border-l-4 p-3 shadow-2xl',
            priorityConfig.borderColor,
            task.status === 'closed' && 'bg-muted/50'
          )}
        >
          <TaskCardContent task={task} />
        </Card>
      );
    },
    []
  );

  // Render mobile accordion card
  const renderMobileCard = useCallback(
    (task: TaskWithClient) => {
      const priorityConfig = getPriorityConfig(task.priority);
      const isUpdating = updatingTaskId === task.id;

      return (
        <Card
          className={cn(
            'border-l-4 p-3',
            priorityConfig.borderColor,
            isUpdating && 'pointer-events-none opacity-50',
            task.status === 'closed' && 'bg-muted/50'
          )}
        >
          <TaskCardContent task={task} isUpdating={isUpdating} />
        </Card>
      );
    },
    [updatingTaskId]
  );

  return (
    <KanbanBoard
      columns={columns}
      onDragEnd={handleDragEnd}
      renderCard={renderCard}
      renderOverlay={renderOverlay}
      onItemClick={handleItemClick}
      emptyMessage="No tasks"
      showMobileAccordion={true}
      mobileAccordionRenderCard={renderMobileCard}
    />
  );
};

export default KanbanView;
