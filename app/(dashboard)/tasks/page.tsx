'use client';

/**
 * Tasks Page
 *
 * Displays the agent's task dashboard with all tasks across all clients.
 * Features filtering by status and priority, and grouping by due date.
 */

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { TaskDashboard } from '@/features/clients/components/TaskDashboard';
import { SectionLoader } from '@/components/ui/SuspenseLoader';
import type { TaskWithClient } from '@/features/clients';

export default function TasksPage() {
  const router = useRouter();

  const handleTaskClick = (task: TaskWithClient) => {
    // Navigate to the client's profile with tasks tab
    router.push(`/clients/${task.client_id}?tab=tasks`);
  };

  return (
    <div className="p-4 lg:p-6">
      <Suspense fallback={<SectionLoader message="Loading tasks..." />}>
        <TaskDashboard onTaskClick={handleTaskClick} />
      </Suspense>
    </div>
  );
}
