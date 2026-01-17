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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clientApi, clientQueryKeys, taskApi } from '@/features/clients/api/clientApi';
import type { TaskWithClient, ClientWithTags, CreateTaskInput } from '@/features/clients';

export default function TasksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <div className="p-4 lg:p-6">
      <Suspense fallback={<SectionLoader message="Loading tasks..." />}>
        <TaskDashboard onTaskClick={handleTaskClick} onAddTask={handleAddTask} />
      </Suspense>

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
