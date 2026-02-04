'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, StickyNote, Briefcase, DollarSign, CheckCircle2, ChevronRight, Plus, Users, Star, Home, Clock, Trophy, AlertCircle } from 'lucide-react';

/**
 * Dashboard Page
 *
 * Main landing page after agent login. Displays key metrics,
 * quick actions, deals closing soon, and recent activity timeline.
 */

// =============================================================================
// TYPES
// =============================================================================

interface DashboardStats {
  pipeline_value: number;
  active_deals_count: number;
  total_clients: number;
  hot_deals_count: number;
  expected_commission: number;
  tasks_due_today: number;
  overdue_tasks: number;
  comparison: {
    won_last_90_days: number;
    lost_last_90_days: number;
  };
  won_this_month: {
    value: number;
    count: number;
  };
}

interface UpcomingTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress';
  is_overdue: boolean;
  is_today: boolean;
  client: {
    id: string;
    name: string;
  } | null;
}

interface Activity {
  id: string;
  type: 'task' | 'note' | 'deal';
  title: string;
  description?: string;
  date: string;
  status?: string;
  priority?: string;
  clientName?: string;
  clientId?: string;
}

// =============================================================================
// COMPONENTS
// =============================================================================

// Metric card component using shadcn Card
function MetricCard({
  title,
  value,
  change,
  changeType,
  icon,
  variant = 'default',
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success';
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold">
              {value}
            </p>
            {change && (
              <p
                className={`mt-1 text-xs font-medium ${
                  changeType === 'positive'
                    ? 'text-green-600'
                    : changeType === 'negative'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {change}
              </p>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            variant === 'danger' ? 'bg-destructive/10 text-destructive' :
            variant === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
            variant === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
            variant === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick action card component
function QuickActionCard({
  title,
  description,
  icon,
  href,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  );
}

// Upcoming task item component
function UpcomingTaskItem({
  task,
  onClick,
}: {
  task: UpcomingTask;
  onClick?: () => void;
}) {
  const formatDueDate = (dateString: string, isOverdue: boolean, isToday: boolean) => {
    if (isOverdue) return 'Overdue';
    if (isToday) return 'Today';

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        task.is_overdue
          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          : task.is_today
          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      }`}>
        {task.is_overdue ? (
          <AlertCircle className="h-4 w-4" strokeWidth={2} />
        ) : (
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${task.is_overdue ? 'text-red-600 dark:text-red-400' : ''}`}>
          {task.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {task.client?.name || 'No client'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-xs font-medium ${
          task.is_overdue ? 'text-red-600 dark:text-red-400' :
          task.is_today ? 'text-amber-600 dark:text-amber-400' :
          'text-muted-foreground'
        }`}>
          {formatDueDate(task.due_date, task.is_overdue, task.is_today)}
        </span>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>
    </button>
  );
}

// Timeline activity item (styled like client overview)
function ActivityItem({
  activity,
  isLast,
}: {
  activity: Activity;
  isLast: boolean;
}) {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTimelineIcon = (type: string) => {
    if (type === 'task') {
      return <CheckCircle className="h-5 w-5" strokeWidth={2.5} />;
    }
    if (type === 'note') {
      return <StickyNote className="h-5 w-5" strokeWidth={2.5} />;
    }
    if (type === 'deal') {
      return <Briefcase className="h-5 w-5" strokeWidth={2.5} />;
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
      )}

      {/* Timeline item */}
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          activity.type === 'task' ? 'bg-purple-200 text-purple-700 dark:bg-purple-800/50 dark:text-purple-200' :
          activity.type === 'note' ? 'bg-blue-200 text-blue-700 dark:bg-blue-800/50 dark:text-blue-200' :
          'bg-green-200 text-green-700 dark:bg-green-800/50 dark:text-green-200'
        }`}>
          {getTimelineIcon(activity.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {activity.title}
            </p>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatRelativeTime(activity.date)}
            </span>
          </div>
          {activity.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
              {activity.description}
            </p>
          )}
          {activity.clientName && (
            <p className="mt-1 text-xs text-muted-foreground">
              {activity.clientName}
            </p>
          )}
          {activity.status && activity.type === 'task' && (
            <div className="mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                activity.status === 'closed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                activity.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {activity.status === 'closed' ? 'Done' :
                 activity.status === 'in_progress' ? 'In Progress' :
                 'To Do'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DashboardPage() {
  const router = useRouter();

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = await res.json();
      return json.data as DashboardStats;
    },
  });

  // Fetch upcoming tasks
  const { data: upcomingTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['dashboard', 'upcoming-tasks'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/upcoming-tasks');
      if (!res.ok) throw new Error('Failed to fetch upcoming tasks');
      const json = await res.json();
      return json.data as UpcomingTask[];
    },
  });

  // Fetch recent activity
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/activity');
      if (!res.ok) throw new Error('Failed to fetch activity');
      const json = await res.json();
      return json.data as Activity[];
    },
  });

  const handleTaskClick = (taskId: string) => {
    router.push(`/tasks?task=${taskId}`);
  };

  const handleAddDeal = () => {
    router.push('/deals/new');
  };

  const handleAddClient = () => {
    router.push('/clients?action=new');
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {/* Won This Month - Primary success indicator */}
        <MetricCard
          title="Won This Month"
          value={statsLoading ? '...' : formatCurrency(statsData?.won_this_month?.value || 0)}
          change={statsData?.won_this_month?.count
            ? `${statsData.won_this_month.count} deal${statsData.won_this_month.count > 1 ? 's' : ''} closed`
            : 'No deals yet'}
          changeType={statsData?.won_this_month?.count && statsData.won_this_month.count > 0 ? 'positive' : 'neutral'}
          variant="success"
          icon={<Trophy className="h-5 w-5" strokeWidth={1.5} />}
        />
        {/* Active Pipeline - Future potential */}
        <MetricCard
          title="Active Pipeline"
          value={statsLoading ? '...' : formatCurrency(statsData?.pipeline_value || 0)}
          change={statsData?.active_deals_count
            ? `${statsData.active_deals_count} active deal${statsData.active_deals_count > 1 ? 's' : ''}`
            : 'No active deals'}
          changeType="neutral"
          variant="info"
          icon={<Briefcase className="h-5 w-5" strokeWidth={1.5} />}
        />
        {/* Expected Commission - Personal motivation */}
        <MetricCard
          title="Expected Commission"
          value={statsLoading ? '...' : formatCurrency(statsData?.expected_commission || 0)}
          change="From active deals"
          changeType="neutral"
          variant="default"
          icon={<DollarSign className="h-5 w-5" strokeWidth={1.5} />}
        />
        {/* Tasks Due - Action urgency */}
        <MetricCard
          title="Tasks Due"
          value={statsLoading ? '...' : (statsData?.tasks_due_today || 0) + (statsData?.overdue_tasks || 0)}
          change={statsData?.overdue_tasks ? `${statsData.overdue_tasks} overdue` : 'All caught up'}
          changeType={statsData && statsData.overdue_tasks > 0 ? 'negative' : 'positive'}
          variant={statsData && statsData.overdue_tasks > 0 ? 'danger' : 'default'}
          icon={<CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Add New Client"
            description="Create a new client profile"
            onClick={handleAddClient}
            icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          />
          <QuickActionCard
            title="Add New Deal"
            description="Create a new deal opportunity"
            onClick={handleAddDeal}
            icon={<Briefcase className="h-6 w-6" strokeWidth={1.5} />}
          />
          <QuickActionCard
            title="View Deals"
            description="Manage your deals"
            href="/deals"
            icon={<Briefcase className="h-6 w-6" strokeWidth={1.5} />}
          />
        </div>
      </div>

      {/* Two column layout for upcoming tasks and activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">
              Upcoming Tasks
            </CardTitle>
            <Button variant="link" asChild className="px-0 text-sm">
              <Link href="/tasks">View all</Link>
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {tasksLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : upcomingTasks && upcomingTasks.length > 0 ? (
              <div className="divide-y divide-border">
                {upcomingTasks.map((task) => (
                  <UpcomingTaskItem
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-2 text-sm text-muted-foreground">No upcoming tasks</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-6">
            {activitiesLoading ? (
              <div className="text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isLast={index === activities.length - 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                <p className="mt-2 text-sm text-muted-foreground">No activity yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
