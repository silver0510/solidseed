'use client';

/**
 * Task Details Dialog Component
 *
 * Displays task information in a popup dialog with the ability to edit.
 * Shows task title, description, status, priority, due date, and client info.
 */

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import { format } from 'date-fns';
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
  client_id: z.string().optional(), // Optional for when client change is not allowed
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
  /** The task to display (null for create mode) */
  task: TaskWithClient | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when task is updated or created */
  onUpdate?: (task: TaskWithClient | null, data: UpdateTaskInput) => Promise<void>;
  /** Whether an update is in progress */
  isUpdating?: boolean;
  /** Whether to start in edit mode (or create mode if task is null) */
  initialEditMode?: boolean;
  /** Whether to show client information (hide when in client profile page) */
  showClientInfo?: boolean;
  /** Whether to allow changing the client (only in edit mode on main tasks page) */
  allowClientChange?: boolean;
  /** List of clients for the dropdown (required if allowClientChange is true) */
  clients?: Array<{ id: string; name: string }>;
  /** Whether clients are loading */
  isLoadingClients?: boolean;
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
  allowClientChange = false,
  clients = [],
  isLoadingClients = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const hasInitialized = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskEditFormData>({
    resolver: zodResolver(taskEditSchema),
  });

  const selectedPriority = watch('priority');
  const selectedStatus = watch('status');
  const selectedClientId = watch('client_id');

  // Handle initial edit mode when dialog opens
  useEffect(() => {
    if (open) {
      if (initialEditMode && !hasInitialized.current) {
        // Set edit mode on first open
        if (task) {
          // Editing existing task
          reset({
            title: task.title,
            description: task.description || '',
            due_date: task.due_date,
            priority: task.priority,
            status: task.status,
            client_id: task.client_id,
          });
        } else {
          // Creating new task
          reset({
            title: '',
            description: '',
            due_date: new Date().toISOString().split('T')[0],
            priority: 'medium',
            status: 'todo',
            client_id: '',
          });
        }
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
        client_id: task.client_id,
      });
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (!task) {
      // If creating new task, close the dialog
      handleOpenChange(false);
    } else {
      // If editing existing task, just exit edit mode
      setIsEditing(false);
      reset();
    }
  };

  // Submit edit form
  const handleFormSubmit = async (data: TaskEditFormData) => {
    if (!onUpdate) return;

    const updateData: UpdateTaskInput = {
      title: data.title,
      description: data.description || undefined,
      due_date: data.due_date,
      priority: data.priority,
      status: data.status,
      // Include client_id if it's being changed
      ...(allowClientChange && data.client_id ? { client_id: data.client_id } : {}),
    };

    await onUpdate(task, updateData);
    setIsEditing(false);
  };

  const isCreateMode = !task;

  // In view mode, we need task data
  const displayInfo = task ? getTaskDisplayInfo(task) : null;
  const statusConfig = task ? STATUS_CONFIG[task.status] : null;
  const priorityConfig = task ? PRIORITY_CONFIG[task.priority] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isCreateMode ? 'Add Task' : isEditing ? 'Edit Task' : 'Task Details'}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Create a new task for this client'
              : isEditing
                ? 'Update the task information below'
                : 'View task information and status'}
          </DialogDescription>
        </DialogHeader>

        {isEditing || isCreateMode ? (
          // Edit Mode
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Client Info - editable if allowClientChange is true, otherwise read-only */}
            {showClientInfo && task && (
              <div className="space-y-2">
                <Label htmlFor="edit-client">Client{allowClientChange && ' *'}</Label>
                {allowClientChange ? (
                  // Editable client selector
                  <Select
                    value={selectedClientId}
                    onValueChange={(value) => setValue('client_id', value)}
                    disabled={isLoadingClients || isUpdating}
                  >
                    <SelectTrigger id="edit-client" className="h-9">
                      <SelectValue placeholder={isLoadingClients ? 'Loading clients...' : 'Select a client'} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  // Read-only client display
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>{task.client_name}</span>
                  </div>
                )}
                {errors.client_id && (
                  <p className="text-sm text-destructive">{errors.client_id.message}</p>
                )}
              </div>
            )}

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

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-due_date">Due Date *</Label>
              <Controller
                name="due_date"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        disabled={isUpdating}
                        className={cn(
                          'w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm h-9',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                          'disabled:cursor-not-allowed disabled:opacity-50',
                          !field.value && 'text-muted-foreground'
                        )}
                        aria-label="Select due date"
                      >
                        <span>
                          {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                        </span>
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                        }}
                        disabled={isUpdating}
                        captionLayout="dropdown"
                        startMonth={new Date(2020, 0)}
                        endMonth={new Date(2100, 11)}
                      />
                    </PopoverContent>
                  </Popover>
                )}
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
                  {(Object.entries(STATUS_CONFIG) as [TaskStatus, typeof STATUS_CONFIG[TaskStatus]][]).map(
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
                {isUpdating ? 'Saving...' : isCreateMode ? 'Add Task' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          // View Mode (only shown when not in create mode and not editing)
          task && statusConfig && priorityConfig && displayInfo && StatusIcon && (
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
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
