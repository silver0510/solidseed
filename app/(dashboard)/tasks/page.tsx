'use client';

/**
 * Tasks Page
 *
 * Displays the agent's task dashboard with all tasks across all clients.
 * Features filtering by status and priority, and grouping by due date.
 */

import { Suspense, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskDashboard } from '@/features/clients/components/TaskDashboard';
import { TaskForm } from '@/features/clients/components/TaskForm';
import { TaskDetailsDialog } from '@/features/clients/components/TaskDetailsDialog';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clientApi, clientQueryKeys, taskApi } from '@/features/clients/api/clientApi';
import type { TaskWithClient, ClientWithTags, CreateTaskInput, UpdateTaskInput } from '@/features/clients';

// Metric card component matching dashboard design
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success';
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-semibold ${
              variant === 'danger' ? 'text-destructive' :
              variant === 'warning' ? 'text-amber-600 dark:text-amber-400' :
              variant === 'info' ? 'text-blue-600 dark:text-blue-400' :
              variant === 'success' ? 'text-green-600 dark:text-green-400' :
              ''
            }`}>
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            variant === 'danger' ? 'bg-destructive/10 text-destructive' :
            variant === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
            variant === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
            variant === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
            'bg-accent text-accent-foreground'
          }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithClient | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [shouldStartInEditMode, setShouldStartInEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithClient | null>(null);

  // Fetch all tasks for metrics
  const { data: allTasksData } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => taskApi.getUserTasks(),
  });

  const tasks = allTasksData ?? [];
  const todoTasks = tasks.filter((t: TaskWithClient) => t.status === 'todo');
  const inProgressTasks = tasks.filter((t: TaskWithClient) => t.status === 'in_progress');
  const closedTasks = tasks.filter((t: TaskWithClient) => t.status === 'closed');
  const activeTasks = [...todoTasks, ...inProgressTasks]; // Combined for overdue/today calculation

  // Calculate overdue and today counts (only from active tasks)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const overdueTasks = activeTasks.filter((t: TaskWithClient) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    return dueDate < today;
  });
  const todayTasks = activeTasks.filter((t: TaskWithClient) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    return dueDate.toDateString() === today.toDateString();
  });

  // Fetch clients for both create and edit dialogs
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: clientQueryKeys.list({ limit: 100 }),
    queryFn: () => clientApi.listClients({ limit: 100 }),
    enabled: isCreateDialogOpen || isDetailsDialogOpen,
  });

  const clients = (clientsData?.data ?? []) as ClientWithTags[];

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: CreateTaskInput }) =>
      taskApi.createTask(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateDialogOpen(false);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ clientId, taskId, data }: { clientId: string; taskId: string; data: UpdateTaskInput }) =>
      taskApi.updateTask(clientId, taskId, data),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Update the selected task with new data
      if (selectedTask) {
        // If client changed, find the new client name
        let clientName = selectedTask.client_name;
        if (updatedTask.client_id !== selectedTask.client_id) {
          const newClient = clients.find(c => c.id === updatedTask.client_id);
          clientName = newClient?.name || 'Unknown Client';
        }

        setSelectedTask({
          ...selectedTask,
          ...updatedTask,
          client_name: clientName,
        });
      }
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: ({ clientId, taskId }: { clientId: string; taskId: string }) =>
      taskApi.deleteTask(clientId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleTaskClick = (task: TaskWithClient) => {
    setSelectedTask(task);
    setShouldStartInEditMode(false);
    setIsDetailsDialogOpen(true);
  };

  const handleTaskUpdate = async (task: TaskWithClient | null, data: UpdateTaskInput) => {
    if (!task) return; // Should not happen in this page (no create mode)

    await updateTaskMutation.mutateAsync({
      clientId: task.client_id,
      taskId: task.id,
      data,
    });
  };

  const handleTaskEdit = (task: TaskWithClient) => {
    setSelectedTask(task);
    setShouldStartInEditMode(true);
    setIsDetailsDialogOpen(true);
  };

  const handleTaskDelete = (task: TaskWithClient) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    await deleteTaskMutation.mutateAsync({
      clientId: taskToDelete.client_id,
      taskId: taskToDelete.id,
    });

    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleAddTask = () => {
    setIsCreateDialogOpen(true);
  };

  const handleFormSubmit = async (clientId: string, data: CreateTaskInput) => {
    await createTaskMutation.mutateAsync({ clientId, data });
  };

  const handleFormCancel = () => {
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          title="Overdue"
          value={overdueTasks.length}
          subtitle="Need attention"
          variant="danger"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <MetricCard
          title="Due Today"
          value={todayTasks.length}
          subtitle="Focus on these"
          variant="warning"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="In Progress"
          value={inProgressTasks.length}
          subtitle="Currently working"
          variant="info"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
          }
        />
        <MetricCard
          title="Closed"
          value={closedTasks.length}
          subtitle="Well done!"
          variant="success"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Task Dashboard Section */}
      <div>
        <h2 className="text-lg font-semibold mb-3">All Tasks</h2>
        <Suspense fallback={<SectionLoader message="Loading tasks..." />}>
          <TaskDashboard
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
            onEdit={handleTaskEdit}
            onDelete={handleTaskDelete}
          />
        </Suspense>
      </div>

      {/* Create Task Dialog - TaskForm with client selector */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for a client. Select a client and fill in the task details.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            clients={clients}
            isLoadingClients={isLoadingClients}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isSubmitting={createTaskMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog - View and edit existing tasks */}
      <TaskDetailsDialog
        task={selectedTask}
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) {
            setShouldStartInEditMode(false);
          }
        }}
        onUpdate={handleTaskUpdate}
        isUpdating={updateTaskMutation.isPending}
        initialEditMode={shouldStartInEditMode}
        allowClientChange={true}
        clients={clients}
        isLoadingClients={isLoadingClients}
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
                <p className="text-xs text-muted-foreground mt-1">Client: {taskToDelete.client_name}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deleteTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteTaskMutation.isPending}
              >
                {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
