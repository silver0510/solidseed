'use client';

/**
 * Kanban View Component
 *
 * Displays tasks organized by status in a kanban board layout.
 * Supports drag-and-drop to change task status.
 *
 * @module features/clients/components/TaskDashboard/KanbanView
 */

import React, { useState } from 'react';
import {
  AlertCircleIcon,
  CircleIcon,
  PlayCircleIcon,
  CheckCircle2Icon,
  GripVerticalIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card } from '@/components/ui/card';
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
    columnBg: 'bg-amber-100/60 dark:bg-amber-900/40',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircleIcon,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-600',
    columnBg: 'bg-blue-100/60 dark:bg-blue-900/40',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle2Icon,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-600',
    columnBg: 'bg-green-100/60 dark:bg-green-900/40',
  },
} as const;

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
    },
    medium: {
      label: 'Medium',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-700 dark:text-amber-400',
    },
    low: {
      label: 'Low',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-700 dark:text-blue-400',
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

interface TaskCardProps {
  task: TaskWithClient;
  onTaskClick?: (task: TaskWithClient) => void;
  onDragStart?: (task: TaskWithClient) => void;
  isUpdating?: boolean;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onTaskClick,
  onDragStart,
  isUpdating = false,
  isDragging = false,
}) => {
  const displayInfo = getTaskDisplayInfo(task);
  const priorityConfig = getPriorityConfig(task.priority);
  const isClosed = task.status === 'closed';

  const handleCardClick = () => {
    if (!isUpdating && onTaskClick) {
      onTaskClick(task);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(task);
    }
    // Set drag data for fallback
    e.dataTransfer.effectAllowed = 'move';
    // Add ghost image styling
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  return (
    <Card
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200',
        isUpdating && 'opacity-50 pointer-events-none',
        isDragging && 'opacity-40 scale-95',
        isClosed && 'bg-muted/50'
      )}
      onClick={handleCardClick}
      draggable={!isUpdating}
      onDragStart={handleDragStart}
    >
      {/* Drag Handle */}
      <div className="flex items-start gap-2 mb-2">
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <h4
            className={cn(
              'text-sm font-medium mb-1 break-words',
              isClosed && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h4>
        </div>
      </div>

      {/* Task Details */}
      <div className="space-y-2 ml-6">
        {/* Client */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
                ? 'text-red-600 dark:text-red-400 font-medium'
                : displayInfo.isDueToday
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-muted-foreground'
          )}
        >
          {!isClosed && displayInfo.isOverdue && (
            <AlertCircleIcon className="h-3.5 w-3.5" />
          )}
          <time dateTime={task.due_date}>
            {formatDueDate(task.due_date, displayInfo)}
          </time>
        </div>
      </div>
    </Card>
  );
};

// =============================================================================
// KANBAN COLUMN COMPONENT
// =============================================================================

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskWithClient[];
  onTaskClick?: (task: TaskWithClient) => void;
  onDragStart?: (task: TaskWithClient) => void;
  updatingTaskId?: string | null;
  draggedTaskId?: string | null;
  justDroppedTaskId?: string | null;
  onDragOver?: (e: React.DragEvent) => void;
  onCardDragOver?: (status: TaskStatus, index: number) => void;
  onDrop?: (status: TaskStatus, dropIndex?: number) => void;
  dragOverInfo?: { status: TaskStatus; index: number } | null;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  tasks,
  onTaskClick,
  onDragStart,
  updatingTaskId,
  draggedTaskId,
  justDroppedTaskId,
  onDragOver,
  onCardDragOver,
  onDrop,
  dragOverInfo,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const taskCount = tasks.length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver?.(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
    onDrop?.(status);
  };

  const handleCardDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
    e.stopPropagation();
    onCardDragOver?.(status, index);
  };

  const handleCardDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop?.(status, index);
  };

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg p-3 min-h-[500px] transition-all duration-200',
        config.columnBg,
        isDragOver && 'ring-2 ring-primary ring-offset-2'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-5 w-5', config.textColor)} />
          <h3 className="font-semibold text-sm">{config.label}</h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {taskCount}
        </span>
      </div>

      {/* Tasks */}
      <div className="flex-1">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No tasks
          </div>
        ) : (
          <div className="space-y-0">
            {tasks.map((task, index) => {
              const showDropIndicator =
                dragOverInfo?.status === status && dragOverInfo?.index === index;

              return (
                <div key={task.id}>
                  {/* Drop zone before card */}
                  <div
                    className={cn(
                      'h-2 transition-all duration-200',
                      showDropIndicator
                        ? 'h-8 bg-primary/20 border-2 border-dashed border-primary rounded-md my-1'
                        : 'h-2'
                    )}
                    onDragOver={handleCardDragOver(index)}
                    onDrop={handleCardDrop(index)}
                  />

                  {/* Task card */}
                  <div
                    className={cn(
                      'mb-2 transition-all duration-300 ease-out',
                      justDroppedTaskId === task.id && 'animate-pulse-once'
                    )}
                  >
                    <TaskCard
                      task={task}
                      onTaskClick={onTaskClick}
                      onDragStart={onDragStart}
                      isUpdating={updatingTaskId === task.id}
                      isDragging={draggedTaskId === task.id}
                    />
                  </div>
                </div>
              );
            })}

            {/* Drop zone after all cards */}
            <div
              className={cn(
                'h-2 transition-all duration-200',
                dragOverInfo?.status === status && dragOverInfo?.index === tasks.length
                  ? 'h-8 bg-primary/20 border-2 border-dashed border-primary rounded-md my-1'
                  : 'h-2'
              )}
              onDragOver={handleCardDragOver(tasks.length)}
              onDrop={handleCardDrop(tasks.length)}
            />
          </div>
        )}
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
  const [draggedTask, setDraggedTask] = useState<TaskWithClient | null>(null);
  const [optimisticTasks, setOptimisticTasks] = useState<TaskWithClient[]>(tasks);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverInfo, setDragOverInfo] = useState<{
    status: TaskStatus;
    index: number;
  } | null>(null);
  const [justDroppedTaskId, setJustDroppedTaskId] = useState<string | null>(null);

  // Track the last synced task IDs to prevent unnecessary resets
  const lastSyncedIdsRef = React.useRef<string>('');

  // Update optimistic tasks when props change
  // Only sync when tasks array length changes or task IDs change (new tasks added/removed)
  // This preserves local reordering while still reflecting external changes
  React.useEffect(() => {
    const newIds = tasks.map(t => t.id).sort().join(',');

    // Only update if tasks were added/removed (different IDs)
    if (lastSyncedIdsRef.current !== newIds) {
      lastSyncedIdsRef.current = newIds;
      setOptimisticTasks(tasks);
    }
  }, [tasks]);

  // Group tasks by status (use optimistic tasks for instant feedback)
  const tasksByStatus = {
    todo: optimisticTasks.filter((t) => t.status === 'todo'),
    in_progress: optimisticTasks.filter((t) => t.status === 'in_progress'),
    closed: optimisticTasks.filter((t) => t.status === 'closed'),
  };

  const handleDragStart = (task: TaskWithClient) => {
    setDraggedTask(task);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCardDragOver = (status: TaskStatus, index: number) => {
    setDragOverInfo({ status, index });
  };

  const handleDrop = async (newStatus: TaskStatus, dropIndex?: number) => {
    if (!draggedTask) return;

    const isSameStatus = draggedTask.status === newStatus;

    setOptimisticTasks((prev) => {
      // Update status if changing columns
      const updatedTask = isSameStatus
        ? draggedTask
        : { ...draggedTask, status: newStatus };

      // Insert at new position
      if (dropIndex !== undefined) {
        // Remove dragged task from its current position
        const filtered = prev.filter((t) => t.id !== draggedTask.id);

        // Split tasks by status
        const statusTasks = filtered.filter((t) => t.status === newStatus);
        const otherTasks = filtered.filter((t) => t.status !== newStatus);

        // Calculate correct insert index
        let insertIndex = dropIndex;

        // If moving within same column, adjust index if needed
        if (isSameStatus) {
          // Find original index of dragged task in this status
          const originalStatusTasks = prev.filter((t) => t.status === newStatus);
          const originalIndex = originalStatusTasks.findIndex((t) => t.id === draggedTask.id);

          // If dropping after original position, decrement index by 1
          // because we removed the item
          if (dropIndex > originalIndex) {
            insertIndex = dropIndex - 1;
          }
        }

        // Insert at calculated index
        statusTasks.splice(insertIndex, 0, updatedTask);

        return [...otherTasks, ...statusTasks];
      } else {
        // Append to end if no specific index
        const filtered = prev.filter((t) => t.id !== draggedTask.id);
        return [...filtered, updatedTask];
      }
    });

    // Highlight the dropped card briefly
    setJustDroppedTaskId(draggedTask.id);
    setTimeout(() => setJustDroppedTaskId(null), 600);

    // Only call API if status changed
    if (!isSameStatus && onStatusChange) {
      try {
        await onStatusChange(draggedTask, newStatus);
      } catch (error) {
        console.error('Failed to update task:', error);
        setOptimisticTasks(tasks);
      }
    }

    setDraggedTask(null);
    setIsDragging(false);
    setDragOverInfo(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setIsDragging(false);
    setDragOverInfo(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" onDragEnd={handleDragEnd}>
      {(['todo', 'in_progress', 'closed'] as const).map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          tasks={tasksByStatus[status]}
          onTaskClick={onTaskClick}
          onDragStart={handleDragStart}
          updatingTaskId={updatingTaskId}
          draggedTaskId={draggedTask?.id || null}
          justDroppedTaskId={justDroppedTaskId}
          onDragOver={handleDragOver}
          onCardDragOver={handleCardDragOver}
          onDrop={handleDrop}
          dragOverInfo={dragOverInfo}
        />
      ))}
    </div>
  );
};

export default KanbanView;
