/**
 * OverviewTab Component
 *
 * Displays client overview information including contact details, deal metrics, and activity summary.
 *
 * @module features/clients/components/ClientProfile/OverviewTab
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, StickyNote, Briefcase, Mail, Phone, MapPin, Cake, CheckSquare, Calendar, FileText } from 'lucide-react';
import { useClientDeals } from '../../hooks/useClientDeals';
import { taskApi, noteApi, documentApi } from '../../api/clientApi';
import type { ClientWithCounts } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the OverviewTab component
 */
export interface OverviewTabProps {
  /** The client data */
  client: ClientWithCounts;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// METRIC CARD COMPONENT
// =============================================================================

/**
 * Metric card component for displaying key statistics
 */
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
            <p className="mt-1 text-2xl font-semibold">{value}</p>
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
            'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// ICONS - Using lucide-react
// =============================================================================

const MailIcon = Mail;
const PhoneIcon = Phone;
const MapPinIcon = MapPin;
const CakeIcon = Cake;


// =============================================================================
// HELPERS
// =============================================================================

/**
 * Format birthday date for display
 */
function formatBirthday(birthday: string): string {
  const date = new Date(birthday);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client overview tab with deal metrics, contact info, and activity stats
 *
 * @example
 * ```tsx
 * <OverviewTab client={client} />
 * ```
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  client,
  className,
}) => {
  // Fetch active deals for this client
  const { deals, totalCount: activeDealsCount, isLoading: dealsLoading } = useClientDeals({
    clientId: client.id,
    activeOnly: true,
  });

  // Calculate total deal value from active deals
  const totalDealValue = deals.reduce((sum, deal) => sum + (deal.deal_value || 0), 0);

  // Fetch tasks and notes
  const { data: tasks } = useQuery({
    queryKey: ['clients', client.id, 'tasks'],
    queryFn: () => taskApi.getClientTasks(client.id),
  });

  const { data: notes } = useQuery({
    queryKey: ['clients', client.id, 'notes'],
    queryFn: () => noteApi.getClientNotes(client.id),
  });

  const { data: documents } = useQuery({
    queryKey: ['clients', client.id, 'documents'],
    queryFn: () => documentApi.getClientDocuments(client.id),
  });

  // Calculate open and overdue tasks
  const { openTasksCount, overdueTasksCount } = React.useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { openTasksCount: 0, overdueTasksCount: 0 };
    }

    const openTasks = tasks.filter(t => t.status !== 'closed');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = openTasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    return {
      openTasksCount: openTasks.length,
      overdueTasksCount: overdueTasks.length,
    };
  }, [tasks]);

  // Calculate days as client
  const daysAsClient = React.useMemo(() => {
    const createdDate = new Date(client.created_at);
    const today = new Date();
    return Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [client.created_at]);

  // Format days as client for display
  const formatDaysAsClient = () => {
    if (daysAsClient === 0) return 'Today';
    if (daysAsClient === 1) return '1 day';
    if (daysAsClient < 30) return `${daysAsClient} days`;
    if (daysAsClient < 365) {
      const months = Math.floor(daysAsClient / 30);
      return months === 1 ? '1 month' : `${months} months`;
    }
    const years = Math.floor(daysAsClient / 365);
    const remainingMonths = Math.floor((daysAsClient % 365) / 30);
    if (remainingMonths === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    }
    return years === 1 ? `1 year ${remainingMonths}mo` : `${years}y ${remainingMonths}mo`;
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

  // Combine all activities (tasks, notes, deals, documents) into timeline
  const timelineItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      type: 'task' | 'note' | 'deal' | 'document';
      title: string;
      description?: string;
      date: Date;
      status?: string;
      priority?: string;
    }> = [];

    // Add tasks
    if (tasks && tasks.length > 0) {
      tasks.slice(0, 5).forEach(task => {
        // Get action verb based on status
        const getTaskAction = (status: string) => {
          if (status === 'closed') return 'Task completed';
          if (status === 'in_progress') return 'Task status updated';
          return 'Task created';
        };

        items.push({
          id: task.id,
          type: 'task',
          title: getTaskAction(task.status),
          description: task.title,
          date: new Date(task.status === 'closed' && task.completed_at ? task.completed_at : task.updated_at),
          status: task.status,
          priority: task.priority,
        });
      });
    }

    // Add notes
    if (notes && notes.length > 0) {
      notes.slice(0, 5).forEach(note => {
        // Truncate content for preview
        const preview = note.content.length > 60
          ? `${note.content.substring(0, 60)}...`
          : note.content;

        items.push({
          id: note.id,
          type: 'note',
          title: 'Note added',
          description: preview,
          date: new Date(note.created_at),
        });
      });
    }

    // Add documents
    if (documents && documents.length > 0) {
      documents.slice(0, 5).forEach(doc => {
        // Format file size for display
        const formatFileSize = (bytes: number) => {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };

        items.push({
          id: doc.id,
          type: 'document',
          title: 'Document uploaded',
          description: `${doc.file_name} • ${formatFileSize(doc.file_size)}`,
          date: new Date(doc.uploaded_at),
        });
      });
    }

    // Add deals
    if (deals && deals.length > 0) {
      deals.slice(0, 3).forEach(deal => {
        // Format stage name to be more readable
        const formatStage = (stage: string) => {
          return stage
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };

        const dealValue = deal.deal_value ? formatCurrency(deal.deal_value) : 'Value not set';

        items.push({
          id: deal.id,
          type: 'deal',
          title: 'Deal created',
          description: `${deal.deal_name} • ${formatStage(deal.current_stage)} • ${dealValue}`,
          date: new Date(deal.created_at),
          status: deal.status,
        });
      });
    }

    // Sort by date (most recent first)
    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  }, [tasks, notes, documents, deals]);

  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get icon for timeline item
  const getTimelineIcon = (type: string) => {
    if (type === 'task') {
      return <CheckCircle className="h-5 w-5" strokeWidth={2.5} />;
    }
    if (type === 'note') {
      return <StickyNote className="h-5 w-5" strokeWidth={2.5} />;
    }
    if (type === 'document') {
      return <FileText className="h-5 w-5" strokeWidth={2.5} />;
    }
    if (type === 'deal') {
      return <Briefcase className="h-5 w-5" strokeWidth={2.5} />;
    }
    return null;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Client Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          title="Active Deals"
          value={dealsLoading ? '...' : activeDealsCount}
          subtitle={activeDealsCount === 1 ? 'Open opportunity' : 'Open opportunities'}
          variant="default"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <MetricCard
          title="Pipeline Value"
          value={dealsLoading ? '...' : formatCurrency(totalDealValue)}
          subtitle="From active deals"
          variant="success"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Open Tasks"
          value={openTasksCount}
          subtitle={overdueTasksCount > 0 ? `${overdueTasksCount} overdue` : 'All on track'}
          variant={overdueTasksCount > 0 ? 'danger' : openTasksCount > 0 ? 'warning' : 'info'}
          icon={<CheckSquare className="h-5 w-5" />}
        />
        <MetricCard
          title="Client Since"
          value={formatDaysAsClient()}
          subtitle={new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          variant="info"
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* Two Column Layout: Contact Info + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Information */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Contact Information
            </h3>

            <div className="space-y-4">
          {/* Email */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <MailIcon className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">Email</p>
              <a
                href={`mailto:${client.email}`}
                className="text-sm text-foreground hover:text-primary transition-colors truncate block"
              >
                {client.email}
              </a>
            </div>
          </div>

          {/* Phone */}
          {client.phone && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <PhoneIcon className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Phone</p>
                <a
                  href={`tel:${client.phone}`}
                  className="text-sm text-foreground hover:text-primary transition-colors"
                >
                  {client.phone}
                </a>
              </div>
            </div>
          )}

          {/* Address */}
          {client.address && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <MapPinIcon className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Address</p>
                <p className="text-sm text-foreground">{client.address}</p>
              </div>
            </div>
          )}

          {/* Birthday */}
          {client.birthday && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                <CakeIcon className="h-4 w-4 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Birthday</p>
                <p className="text-sm text-foreground">{formatBirthday(client.birthday)}</p>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Recent Activity
            </h3>

            {timelineItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineItems.map((item, index) => (
                  <div key={item.id} className="relative">
                    {/* Timeline line */}
                    {index < timelineItems.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                    )}

                    {/* Timeline item */}
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        item.type === 'task' ? 'bg-purple-200 text-purple-700 dark:bg-purple-800/50 dark:text-purple-200' :
                        item.type === 'note' ? 'bg-blue-200 text-blue-700 dark:bg-blue-800/50 dark:text-blue-200' :
                        item.type === 'document' ? 'bg-amber-200 text-amber-700 dark:bg-amber-800/50 dark:text-amber-200' :
                        'bg-green-200 text-green-700 dark:bg-green-800/50 dark:text-green-200'
                      }`}>
                        {getTimelineIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.title}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatRelativeTime(item.date)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.status && item.type === 'task' && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              item.status === 'closed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              item.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              {item.status === 'closed' ? 'Done' :
                               item.status === 'in_progress' ? 'In Progress' :
                               'To Do'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
