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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithClient | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

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

  // Fetch clients for the dropdown
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: clientQueryKeys.list({ limit: 100 }),
    queryFn: () => clientApi.listClients({ limit: 100 }),
    enabled: isDialogOpen,
  });

  const clients = (clientsData?.data ?? []) as ClientWithTags[];

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: CreateTaskInput }) =>
      taskApi.createTask(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsDialogOpen(false);
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
        setSelectedTask({
          ...selectedTask,
          ...updatedTask,
        });
      }
    },
  });

  const handleTaskClick = (task: TaskWithClient) => {
    setSelectedTask(task);
    setIsDetailsDialogOpen(true);
  };

  const handleTaskUpdate = async (task: TaskWithClient, data: UpdateTaskInput) => {
    await updateTaskMutation.mutateAsync({
      clientId: task.client_id,
      taskId: task.id,
      data,
    });
  };

  const handleAddTask = () => {
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (clientId: string, data: CreateTaskInput) => {
    await createTaskMutation.mutateAsync({ clientId, data });
  };

  const handleFormCancel = () => {
    setIsDialogOpen(false);
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
          <TaskDashboard onTaskClick={handleTaskClick} onAddTask={handleAddTask} />
        </Suspense>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
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

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onUpdate={handleTaskUpdate}
        isUpdating={updateTaskMutation.isPending}
      />
    </div>
  );
}
