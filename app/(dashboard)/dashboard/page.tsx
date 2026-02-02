'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, StickyNote, Briefcase, DollarSign, TrendingUp, CheckCircle2, ChevronRight, Plus, Users, Star, Home, Calendar, Clock } from 'lucide-react';

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
          icon={<DollarSign className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="Active Deals"
          value={statsLoading ? '...' : statsData?.active_deals_count || 0}
          change={statsData?.hot_deals_count ? `${statsData.hot_deals_count} closing soon` : undefined}
          changeType="neutral"
          variant="info"
          icon={<Briefcase className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="Close Rate"
          value={statsLoading ? '...' : `${statsData?.close_rate || 0}%`}
          change="Last 90 days"
          changeType={statsData && statsData.close_rate >= 70 ? 'positive' : statsData && statsData.close_rate >= 50 ? 'neutral' : 'negative'}
          variant={statsData && statsData.close_rate >= 70 ? 'success' : statsData && statsData.close_rate >= 50 ? 'warning' : 'danger'}
          icon={<TrendingUp className="h-5 w-5" strokeWidth={1.5} />}
        />
        <MetricCard
          title="Action Items"
          value={statsLoading ? '...' : (statsData?.tasks_due_today || 0) + (statsData?.overdue_tasks || 0)}
          change={statsData?.overdue_tasks ? `${statsData.overdue_tasks} overdue` : 'All caught up'}
          changeType={statsData && statsData.overdue_tasks > 0 ? 'negative' : 'positive'}
          variant={statsData && statsData.overdue_tasks > 0 ? 'danger' : statsData && statsData.tasks_due_today > 3 ? 'warning' : 'default'}
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
            title="Add New Deal"
            description="Create a new deal opportunity"
            onClick={handleAddDeal}
            icon={<Briefcase className="h-6 w-6" strokeWidth={1.5} />}
          />
          <QuickActionCard
            title="Add New Client"
            description="Create a new client profile"
            onClick={handleAddClient}
            icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
          />
          <QuickActionCard
            title="View Deals"
            description="Manage your deals"
            href="/deals"
            icon={<Briefcase className="h-6 w-6" strokeWidth={1.5} />}
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
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
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
