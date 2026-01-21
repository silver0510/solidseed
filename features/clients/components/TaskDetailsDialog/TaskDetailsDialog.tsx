'use client';

/**
 * Task Details Dialog Component
 *
 * Displays task information in a popup dialog with the ability to edit.
 * Shows task title, description, status, priority, due date, and client info.
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleIcon,
  PencilIcon,
  PlayCircleIcon,
  UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTaskDisplayInfo, formatDate } from '../../helpers';
import type { TaskWithClient, UpdateTaskInput, TaskStatus, TaskPriority } from '../../types';

// =============================================================================
// SCHEMA
// =============================================================================

const taskEditSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must be 255 characters or less'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['todo', 'in_progress', 'closed']),
});

type TaskEditFormData = z.infer<typeof taskEditSchema>;

// =============================================================================
// STATUS CONFIGURATION
// =============================================================================

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    icon: CircleIcon,
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircleIcon,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle2Icon,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
  },
} as const;

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  medium: {
    label: 'Medium',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-700 dark:text-amber-400',
  },
  high: {
    label: 'High',
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-700 dark:text-red-400',
  },
} as const;

// =============================================================================
// TYPES
// =============================================================================

export interface TaskDetailsDialogProps {
  /** The task to display */
  task: TaskWithClient | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when task is updated */
  onUpdate?: (task: TaskWithClient, data: UpdateTaskInput) => Promise<void>;
  /** Whether an update is in progress */
  isUpdating?: boolean;
  /** Whether to start in edit mode */
  initialEditMode?: boolean;
  /** Whether to show client information (hide when in client profile page) */
  showClientInfo?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task,
  open,
  onOpenChange,
  onUpdate,
  isUpdating = false,
  initialEditMode = false,
  showClientInfo = true,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const hasInitialized = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskEditFormData>({
    resolver: zodResolver(taskEditSchema),
  });

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');

  // Handle initial edit mode when dialog opens
  useEffect(() => {
    if (open && task) {
      if (initialEditMode && !hasInitialized.current) {
        // Only set edit mode on first open
        reset({
          title: task.title,
          description: task.description || '',
          due_date: task.due_date,
          priority: task.priority,
          status: task.status,
        });
        setIsEditing(true);
        hasInitialized.current = true;
      }
    } else if (!open) {
      // Reset when dialog closes
      setIsEditing(false);
      hasInitialized.current = false;
    }
  }, [open, task, initialEditMode, reset]);

  // Reset form and edit state when task changes or dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
      reset();
    }
    onOpenChange(newOpen);
  };

  // Start editing mode
  const handleStartEdit = () => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date,
        priority: task.priority,
        status: task.status,
      });
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  // Submit edit form
  const handleFormSubmit = async (data: TaskEditFormData) => {
    if (!task || !onUpdate) return;

    const updateData: UpdateTaskInput = {
      title: data.title,
      description: data.description || undefined,
      due_date: data.due_date,
      priority: data.priority,
      status: data.status,
    };

    await onUpdate(task, updateData);
    setIsEditing(false);
  };

  if (!task) return null;

  const displayInfo = getTaskDisplayInfo(task);
  const statusConfig = STATUS_CONFIG[task.status];
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditing ? 'Edit Task' : 'Task Details'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the task information below'
              : 'View task information and status'}
          </DialogDescription>
        </DialogHeader>

        {isEditing ? (
          // Edit Mode
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                {...register('title')}
                placeholder="Enter task title"
                className="h-9"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...register('description')}
                placeholder="Enter task description (optional)"
                rows={3}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => setValue('status', value as TaskStatus)}
              >
                <SelectTrigger id="edit-status" className="h-9">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_CONFIG) as [TaskStatus, typeof statusConfig][]).map(
                    ([status, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn('h-4 w-4', config.textColor)} />
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      );
                    }
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-due_date">Due Date *</Label>
              <Input
                id="edit-due_date"
                type="date"
                {...register('due_date')}
                className="h-9"
              />
              {errors.due_date && (
                <p className="text-sm text-destructive">{errors.due_date.message}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={selectedPriority}
                onValueChange={(value) => setValue('priority', value as TaskPriority)}
              >
                <SelectTrigger id="edit-priority" className="h-9">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Info (read-only) */}
            {showClientInfo && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Client</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="h-4 w-4" />
                  <span>{task.client_name}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          // View Mode
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3
                className={cn(
                  'text-base font-medium',
                  task.status === 'closed' && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </h3>
            </div>

            {/* Description */}
            {task.description && (
              <div className="text-sm text-muted-foreground">
                {task.description}
              </div>
            )}

            {/* Status & Priority Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Badge */}
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  statusConfig.bgColor,
                  statusConfig.textColor
                )}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </div>

              {/* Priority Badge */}
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                  priorityConfig.bgColor,
                  priorityConfig.textColor
                )}
              >
                {priorityConfig.label} Priority
              </span>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span
                className={cn(
                  task.status !== 'closed' && displayInfo.isOverdue
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : task.status !== 'closed' && displayInfo.isDueToday
                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                      : 'text-muted-foreground'
                )}
              >
                {formatDate(task.due_date)}
                {task.status !== 'closed' && displayInfo.isOverdue && (
                  <span className="ml-1 inline-flex items-center gap-1">
                    <AlertCircleIcon className="h-3.5 w-3.5" />
                    (Overdue)
                  </span>
                )}
                {task.status !== 'closed' && displayInfo.isDueToday && (
                  <span className="ml-1">(Today)</span>
                )}
              </span>
            </div>

            {/* Client */}
            {showClientInfo && (
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Client:</span>
                <Link
                  href={`/clients/${task.client_id}`}
                  className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm"
                  onClick={(e) => {
                    // Close the dialog when clicking the link
                    e.stopPropagation();
                    handleOpenChange(false);
                  }}
                >
                  {task.client_name}
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              {onUpdate && (
                <Button onClick={handleStartEdit}>
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
