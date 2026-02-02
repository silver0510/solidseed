'use client';

/**
 * Tasks Page
 *
 * Displays the agent's task dashboard with all tasks across all clients.
 * Features filtering by status and priority, and grouping by due date.
 */

import { Suspense, useState, useMemo } from 'react';
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
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

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

  // Fetch all tasks for metrics - uses same cache key as TaskDashboard
  const { data: allTasksData } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => taskApi.getUserTasks(),
  });

  // Memoize all metric calculations to avoid recalculating on every render
  const { todoCount, inProgressCount, closedCount, overdueCount, todayCount } = useMemo(() => {
    const tasks = allTasksData ?? [];

    let todo = 0;
    let inProgress = 0;
    let closed = 0;
    let overdue = 0;
    let dueToday = 0;

    // Single pass through tasks for all calculations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const task of tasks) {
      // Count by status
      if (task.status === 'todo') {
        todo++;
      } else if (task.status === 'in_progress') {
        inProgress++;
      } else if (task.status === 'closed') {
        closed++;
        continue; // Closed tasks don't count for overdue/today
      }

      // Count overdue and today (only for active tasks)
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        if (dueDateStart.getTime() === todayStart.getTime()) {
          dueToday++;
        } else if (dueDateStart < todayStart) {
          overdue++;
        }
      }
    }

    return {
      todoCount: todo,
      inProgressCount: inProgress,
      closedCount: closed,
      overdueCount: overdue,
      todayCount: dueToday,
    };
  }, [allTasksData]);

  // Fetch clients for both create and edit dialogs
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: clientQueryKeys.list({ limit: 100 }),
    queryFn: () => clientApi.listClients({ limit: 100 }),
    enabled: isCreateDialogOpen || isDetailsDialogOpen,
  });

  const clients = (clientsData?.data ?? []) as ClientWithTags[];

  // Helper to update task cache optimistically
  const updateTaskCache = (
    updateFn: (tasks: TaskWithClient[] | undefined) => TaskWithClient[]
  ) => {
    const queryCache = queryClient.getQueryCache();
    const taskQueries = queryCache.findAll({ queryKey: ['tasks', 'all'] });
    for (const query of taskQueries) {
      queryClient.setQueryData<TaskWithClient[]>(query.queryKey, updateFn);
    }
  };

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: CreateTaskInput }) =>
      taskApi.createTask(clientId, data),
    onSuccess: (newTask) => {
      // Find the client name for the new task
      const client = clients.find(c => c.id === newTask.client_id);
      const taskWithClient: TaskWithClient = {
        ...newTask,
        client_name: client?.name || 'Unknown Client',
      };

      // Add the new task to all task caches
      updateTaskCache((old) => old ? [taskWithClient, ...old] : [taskWithClient]);
      setIsCreateDialogOpen(false);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ clientId, taskId, data }: { clientId: string; taskId: string; data: UpdateTaskInput }) =>
      taskApi.updateTask(clientId, taskId, data),
    onSuccess: (updatedTask) => {
      // If client changed, find the new client name
      let clientName = selectedTask?.client_name || 'Unknown Client';
      if (selectedTask && updatedTask.client_id !== selectedTask.client_id) {
        const newClient = clients.find(c => c.id === updatedTask.client_id);
        clientName = newClient?.name || 'Unknown Client';
      }

      // Update all task caches with the updated task
      updateTaskCache((old) =>
        old?.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask, client_name: clientName } : t
        ) ?? []
      );

      // Update the selected task with new data
      if (selectedTask) {
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
    onSuccess: (_, { taskId }) => {
      // Remove the task from all caches
      updateTaskCache((old) => old?.filter((t) => t.id !== taskId) ?? []);
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
          value={overdueCount}
          subtitle="Need attention"
          variant="danger"
          icon={<AlertTriangle className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="Due Today"
          value={todayCount}
          subtitle="Focus on these"
          variant="warning"
          icon={<Clock className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="In Progress"
          value={inProgressCount}
          subtitle="Currently working"
          variant="info"
          icon={<Clock className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="Closed"
          value={closedCount}
          subtitle="Well done!"
          variant="success"
          icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />}
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
