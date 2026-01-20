'use client';

/**
 * Tasks Page
 *
 * Displays the agent's task dashboard with all tasks across all clients.
 * Features filtering by status and priority, and grouping by due date.
 */

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskDashboard } from '@/features/clients/components/TaskDashboard';
import { TaskForm } from '@/features/clients/components/TaskForm';
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
import type { TaskWithClient, ClientWithTags, CreateTaskInput } from '@/features/clients';

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
  variant?: 'default' | 'warning' | 'danger';
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all tasks for metrics
  const { data: allTasksData } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => taskApi.getUserTasks(),
  });

  const tasks = allTasksData ?? [];
  const pendingTasks = tasks.filter((t: TaskWithClient) => t.status === 'pending');
  const completedTasks = tasks.filter((t: TaskWithClient) => t.status === 'completed');

  // Calculate overdue and today counts
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const overdueTasks = pendingTasks.filter((t: TaskWithClient) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    return dueDate < today;
  });
  const todayTasks = pendingTasks.filter((t: TaskWithClient) => {
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

  const handleTaskClick = (task: TaskWithClient) => {
    router.push(`/clients/${task.client_id}?tab=tasks`);
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
          title="Pending"
          value={pendingTasks.length}
          subtitle="In progress"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Completed"
          value={completedTasks.length}
          subtitle="Well done!"
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
    </div>
  );
}
