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
import { TaskForm } from '../TaskForm';
import { taskApi } from '../../api/clientApi';
import type { ClientTask, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the TasksTab component
 */
export interface TasksTabProps {
  /** Client ID */
  clientId: string;
  /** Client name (for display in create task form) */
  clientName: string;
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
  clientName,
  tasks,
  onTaskChanged,
  className,
}) => {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<ClientTask | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ClientTask | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Handle opening dialog for new task
  const handleAddTask = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

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
    async (task: ClientTask | null, data: UpdateTaskInput) => {
      if (!task?.id) return; // Should not happen in edit mode

      setUpdatingTaskId(task.id);
      try {
        await taskApi.updateTask(clientId, task.id, data);
        onTaskChanged?.();
        setIsDetailsDialogOpen(false);
        setSelectedTask(null);
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      } finally {
        setUpdatingTaskId(null);
      }
    },
    [clientId, onTaskChanged]
  );

  // Handle task creation
  const handleTaskCreate = useCallback(
    async (selectedClientId: string, data: CreateTaskInput) => {
      setIsCreatingTask(true);
      try {
        await taskApi.createTask(selectedClientId, data);
        onTaskChanged?.();
        setIsCreateDialogOpen(false);
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      } finally {
        setIsCreatingTask(false);
      }
    },
    [onTaskChanged]
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
      <div className="flex justify-end">
        <button
          onClick={handleAddTask}
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

      {/* Task List */}
      <TaskList
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        updatingTaskId={updatingTaskId ?? undefined}
        deletingTaskId={deletingTaskId ?? undefined}
      />

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription>
              Create a new task for {clientName}.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            fixedClientId={clientId}
            fixedClientName={clientName}
            onSubmit={handleTaskCreate}
            onCancel={() => setIsCreateDialogOpen(false)}
            isSubmitting={isCreatingTask}
          />
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog (for editing) */}
      <TaskDetailsDialog
        task={
          selectedTask
            ? {
                ...selectedTask,
                client_name: clientName,
              }
            : null
        }
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onUpdate={handleTaskUpdate}
        isUpdating={!!updatingTaskId}
        initialEditMode={true}
        showClientInfo={false}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
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
