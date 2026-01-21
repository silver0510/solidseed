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
import { TaskDetailsDialog } from '../TaskDetailsDialog';
import { taskApi } from '../../api/clientApi';
import type { ClientTask, TaskStatus, CreateTaskInput, UpdateTaskInput, TaskWithClient } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// =============================================================================
// TYPES & SCHEMA
// =============================================================================

/**
 * Task form schema
 */
const taskFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must be 255 characters or less'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Due date is required'),
  priority: z.enum(['low', 'medium', 'high']),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

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
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ClientTask | null>(null);

  // Task form
  const {
    register,
    handleSubmit: handleFormSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'medium',
    },
  });

  const selectedPriority = watch('priority');

  // Handle task creation
  const handleTaskSubmit = useCallback(
    async (data: TaskFormData) => {
      setIsSubmitting(true);
      try {
        await taskApi.createTask(clientId, data as CreateTaskInput);
        reset();
        setShowTaskForm(false);
        onTaskChanged?.();
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clientId, onTaskChanged, reset]
  );

  // Handle cancel task form
  const handleCancelTaskForm = useCallback(() => {
    reset();
    setShowTaskForm(false);
  }, [reset]);

  // Handle task status change
  const handleStatusChange = useCallback(
    async (task: ClientTask, newStatus: TaskStatus) => {
      setUpdatingTaskId(task.id);
      try {
        await taskApi.updateTask(clientId, task.id, { status: newStatus });
        onTaskChanged?.();
      } catch (error) {
        console.error('Failed to update task status:', error);
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [clientId, onTaskChanged]
  );

  // Handle task edit - open edit dialog
  const handleEdit = useCallback((task: ClientTask) => {
    setSelectedTask(task);
    setIsDetailsDialogOpen(true);
  }, []);

  // Handle task update
  const handleTaskUpdate = useCallback(
    async (task: ClientTask, data: UpdateTaskInput) => {
      setUpdatingTaskId(task.id);
      try {
        await taskApi.updateTask(clientId, task.id, data);
        onTaskChanged?.();
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [clientId, onTaskChanged]
  );

  // Handle task deletion - open confirm dialog
  const handleDelete = useCallback((task: ClientTask) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm and execute delete
  const handleConfirmDelete = useCallback(async () => {
    if (!taskToDelete) return;

    setDeletingTaskId(taskToDelete.id);
    try {
      await taskApi.deleteTask(clientId, taskToDelete.id);
      onTaskChanged?.();
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setDeletingTaskId(null);
    }
  }, [taskToDelete, clientId, onTaskChanged]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Task Button */}
      {!showTaskForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowTaskForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span>Add Task</span>
          </button>
        </div>
      )}

      {/* Task Form */}
      {showTaskForm && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Add New Task</h3>
          <form onSubmit={handleFormSubmit(handleTaskSubmit)} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter task description (optional)"
                rows={3}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date *</Label>
              <Input
                id="due_date"
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
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={selectedPriority}
                onValueChange={(value) => setValue('priority', value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger id="priority" className="h-9">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelTaskForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
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

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={
          selectedTask
            ? {
                ...selectedTask,
                client_name: '', // ClientTask doesn't have client_name, but it's not used in edit mode
              }
            : null
        }
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onUpdate={handleTaskUpdate}
        isUpdating={updatingTaskId === selectedTask?.id}
        initialEditMode={true}
        showClientInfo={false}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {taskToDelete && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm font-medium text-foreground">{taskToDelete.title}</p>
                {taskToDelete.due_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {new Date(taskToDelete.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deletingTaskId === taskToDelete?.id}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingTaskId === taskToDelete?.id}
              >
                {deletingTaskId === taskToDelete?.id ? 'Deleting...' : 'Delete Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksTab;
