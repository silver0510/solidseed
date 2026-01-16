import { PageLoader } from '@/components/ui/SuspenseLoader';

export default function TasksLoading() {
  return <PageLoader message="Loading tasks..." />;
}
