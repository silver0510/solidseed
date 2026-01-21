'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

/**
 * Dashboard Page
 *
 * Main landing page after agent login. Displays key metrics,
 * quick actions, and upcoming tasks overview.
 */

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
        <svg
          className="h-5 w-5 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
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

// Task preview item component
function TaskPreviewItem({
  title,
  clientName,
  dueDate,
  priority,
  onClick,
}: {
  title: string;
  clientName: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  onClick?: () => void;
}) {
  const priorityVariant = {
    high: 'destructive' as const,
    medium: 'secondary' as const,
    low: 'outline' as const,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{clientName}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">{dueDate}</span>
        <Badge variant={priorityVariant[priority]} className="capitalize">
          {priority}
        </Badge>
      </div>
    </button>
  );
}

// Recent activity item component
function ActivityItem({
  title,
  description,
  time,
  icon,
}: {
  title: string;
  description: string;
  time: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-muted text-muted-foreground">
          {icon}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{time}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // Mock data - will be replaced with real data from API
  const metrics = {
    totalClients: 127,
    activeTasks: 24,
    completedThisWeek: 18,
    upcomingToday: 5,
  };

  const upcomingTasks = [
    {
      id: '1',
      title: 'Follow up on property viewing',
      clientName: 'John Smith',
      dueDate: 'Today',
      priority: 'high' as const,
      clientId: 'client-1',
    },
    {
      id: '2',
      title: 'Send contract documents',
      clientName: 'Sarah Johnson',
      dueDate: 'Today',
      priority: 'high' as const,
      clientId: 'client-2',
    },
    {
      id: '3',
      title: 'Schedule inspection',
      clientName: 'Michael Brown',
      dueDate: 'Tomorrow',
      priority: 'medium' as const,
      clientId: 'client-3',
    },
    {
      id: '4',
      title: 'Update listing photos',
      clientName: 'Emily Davis',
      dueDate: 'Wed',
      priority: 'low' as const,
      clientId: 'client-4',
    },
  ];

  const recentActivity = [
    {
      id: '1',
      title: 'New client added',
      description: 'Robert Wilson was added to your client list',
      time: '2h ago',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
        </svg>
      ),
    },
    {
      id: '2',
      title: 'Task completed',
      description: 'You marked "Send welcome email" as complete',
      time: '4h ago',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: '3',
      title: 'Document uploaded',
      description: 'Contract.pdf added to Sarah Johnson\'s profile',
      time: '6h ago',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
  ];

  const handleTaskClick = (task: typeof upcomingTasks[0]) => {
    router.push(`/clients/${task.clientId}?tab=tasks`);
  };

  const handleAddClient = () => {
    // TODO: Open client form modal
    console.log('Add client clicked');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          title="Total Clients"
          value={metrics.totalClients}
          change="+12 this month"
          changeType="positive"
          variant="info"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Active Tasks"
          value={metrics.activeTasks}
          change={`${metrics.upcomingToday} due today`}
          changeType="neutral"
          variant="default"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Completed"
          value={metrics.completedThisWeek}
          change="This week"
          changeType="positive"
          variant="success"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
            </svg>
          }
        />
        <MetricCard
          title="Due Today"
          value={metrics.upcomingToday}
          change="Tasks pending"
          changeType={metrics.upcomingToday > 3 ? 'negative' : 'neutral'}
          variant={metrics.upcomingToday > 3 ? 'danger' : 'warning'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickActionCard
            title="Add New Client"
            description="Create a new client profile"
            onClick={handleAddClient}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            }
          />
          <QuickActionCard
            title="View All Tasks"
            description="Manage your task list"
            href="/tasks"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Two column layout for tasks and activity */}
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
            <div className="divide-y divide-border">
              {upcomingTasks.map((task) => (
                <TaskPreviewItem
                  key={task.id}
                  title={task.title}
                  clientName={task.clientName}
                  dueDate={task.dueDate}
                  priority={task.priority}
                  onClick={() => handleTaskClick(task)}
                />
              ))}
            </div>
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
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                  icon={activity.icon}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
