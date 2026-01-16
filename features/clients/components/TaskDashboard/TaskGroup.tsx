/**
 * TaskGroup Component
 *
 * Collapsible group of tasks with a header showing title and count.
 * Used within TaskDashboard to group tasks by due date category.
 *
 * @module features/clients/components/TaskDashboard/TaskGroup
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from '../TaskCard';
import type { TaskWithClient, TaskStatus } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TaskGroup component
 */
export interface TaskGroupProps {
  /** Group title (e.g., "Overdue", "Today", "Upcoming") */
  title: string;
  /** Tasks in this group */
  tasks: TaskWithClient[];
  /** Callback when task status is changed */
  onStatusChange?: (task: TaskWithClient, newStatus: TaskStatus) => void;
  /** Callback when task is clicked */
  onTaskClick?: (task: TaskWithClient) => void;
  /** ID of task currently being updated */
  updatingTaskId?: string;
  /** Whether the group is expanded by default */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS (inline SVG)
// =============================================================================

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
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
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
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
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
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
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
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
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get the icon for a group based on its title
 */
function getGroupIcon(title: string) {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('overdue')) {
    return <AlertTriangleIcon className="w-4 h-4" />;
  }
  if (lowerTitle.includes('today')) {
    return <ClockIcon className="w-4 h-4" />;
  }
  if (lowerTitle.includes('completed')) {
    return <CheckCircleIcon className="w-4 h-4" />;
  }
  return <CalendarIcon className="w-4 h-4" />;
}

/**
 * Get CSS classes for group header based on title
 */
function getGroupHeaderClasses(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('overdue')) {
    return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30';
  }
  if (lowerTitle.includes('today')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/30';
  }
  if (lowerTitle.includes('completed')) {
    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30';
  }
  return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
}

/**
 * Get CSS classes for badge based on title
 */
function getBadgeClasses(title: string): string {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('overdue')) {
    return 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200';
  }
  if (lowerTitle.includes('today')) {
    return 'bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200';
  }
  if (lowerTitle.includes('completed')) {
    return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
  }
  return 'bg-secondary text-secondary-foreground';
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Collapsible task group with styled header
 *
 * @example
 * ```tsx
 * <TaskGroup
 *   title="Overdue"
 *   tasks={overdueTasks}
 *   onStatusChange={(task, status) => updateTask(task.id, status)}
 *   defaultExpanded={true}
 * />
 * ```
 */
export const TaskGroup: React.FC<TaskGroupProps> = ({
  title,
  tasks,
  onStatusChange,
  onTaskClick,
  updatingTaskId,
  defaultExpanded = true,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const taskCount = tasks.length;

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleStatusChange = (task: TaskWithClient, newStatus: TaskStatus) => {
    onStatusChange?.(task, newStatus);
  };

  const handleTaskClick = (task: TaskWithClient) => {
    onTaskClick?.(task);
  };

  return (
    <Card
      className={cn('overflow-hidden', className)}
    >
      {/* Group Header */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={`task-group-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className={cn(
          'w-full flex items-center justify-between p-3 border-b',
          'transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
          getGroupHeaderClasses(title)
        )}
      >
        <div className="flex items-center gap-2">
          {getGroupIcon(title)}
          <span className="font-semibold text-sm">{title}</span>
          <span
            className={cn(
              'inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full',
              getBadgeClasses(title)
            )}
          >
            {taskCount}
          </span>
        </div>
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-200',
            isExpanded ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>

      {/* Task List */}
      <div
        id={`task-group-${title.toLowerCase().replace(/\s+/g, '-')}`}
        role="region"
        aria-label={`${title} task list`}
        className={cn(
          'transition-all duration-200',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}
      >
        {taskCount > 0 ? (
          <ul role="list" className="divide-y divide-border bg-card">
            {tasks.map((task) => (
              <li key={task.id} className="p-3">
                <div
                  className="cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTaskClick(task);
                    }
                  }}
                >
                  {/* Client Name Badge */}
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {task.client_name}
                    </Badge>
                  </div>
                  {/* Task Card */}
                  <TaskCard
                    task={task}
                    onStatusChange={(t, status) => {
                      // Prevent click propagation and handle status change
                      handleStatusChange(t as TaskWithClient, status);
                    }}
                    isUpdating={updatingTaskId === task.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            No tasks in this group
          </CardContent>
        )}
      </div>
    </Card>
  );
};

export default TaskGroup;
