'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, StickyNote, Briefcase } from 'lucide-react';

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
  close_rate: number;
  hot_deals_count: number;
  expected_commission: number;
  tasks_due_today: number;
  overdue_tasks: number;
  comparison: {
    won_last_90_days: number;
    lost_last_90_days: number;
  };
}

interface ClosingSoonDeal {
  id: string;
  deal_name: string;
  deal_value: number | null;
  expected_close_date: string;
  current_stage: string;
  status: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  deal_type: {
    type_name: string;
    icon: string | null;
    color: string;
  };
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

// Deal closing soon item component
function ClosingDealItem({
  deal,
  onClick,
}: {
  deal: ClosingSoonDeal;
  onClick?: () => void;
}) {
  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{deal.deal_name}</p>
        <p className="text-sm text-muted-foreground truncate">{deal.client.name}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-medium">{formatCurrency(deal.deal_value)}</span>
        <span className="text-xs text-muted-foreground">{formatDate(deal.expected_close_date)}</span>
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

  // Fetch deals closing soon
  const { data: closingDeals, isLoading: closingLoading } = useQuery({
    queryKey: ['dashboard', 'closing-soon'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/closing-soon');
      if (!res.ok) throw new Error('Failed to fetch closing deals');
      const json = await res.json();
      return json.data as ClosingSoonDeal[];
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

  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
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
        <MetricCard
          title="Total Deal Value"
          value={statsLoading ? '...' : formatCurrency(statsData?.pipeline_value || 0)}
          change={statsData?.active_deals_count ? `${statsData.active_deals_count} active deals` : undefined}
          changeType="neutral"
          variant="success"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Active Deals"
          value={statsLoading ? '...' : statsData?.active_deals_count || 0}
          change={statsData?.hot_deals_count ? `${statsData.hot_deals_count} closing soon` : undefined}
          changeType="neutral"
          variant="info"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          }
        />
        <MetricCard
          title="Close Rate"
          value={statsLoading ? '...' : `${statsData?.close_rate || 0}%`}
          change="Last 90 days"
          changeType={statsData && statsData.close_rate >= 70 ? 'positive' : statsData && statsData.close_rate >= 50 ? 'neutral' : 'negative'}
          variant={statsData && statsData.close_rate >= 70 ? 'success' : statsData && statsData.close_rate >= 50 ? 'warning' : 'danger'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
        <MetricCard
          title="Action Items"
          value={statsLoading ? '...' : (statsData?.tasks_due_today || 0) + (statsData?.overdue_tasks || 0)}
          change={statsData?.overdue_tasks ? `${statsData.overdue_tasks} overdue` : 'All caught up'}
          changeType={statsData && statsData.overdue_tasks > 0 ? 'negative' : 'positive'}
          variant={statsData && statsData.overdue_tasks > 0 ? 'danger' : statsData && statsData.tasks_due_today > 3 ? 'warning' : 'default'}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Add New Deal"
            description="Create a new deal opportunity"
            onClick={handleAddDeal}
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
          />
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
            title="View Deals"
            description="Manage your deals"
            href="/deals"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Two column layout for closing deals and activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deals closing soon */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">
              Closing This Month
            </CardTitle>
            <Button variant="link" asChild className="px-0 text-sm">
              <Link href="/deals">View all</Link>
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {closingLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : closingDeals && closingDeals.length > 0 ? (
              <div className="divide-y divide-border">
                {closingDeals.map((deal) => (
                  <ClosingDealItem
                    key={deal.id}
                    deal={deal}
                    onClick={() => handleDealClick(deal.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">No deals closing soon</p>
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
                <svg className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">No activity yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
