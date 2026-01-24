/**
 * ActivityTab Component
 *
 * Displays:
 * - Activity feed (reverse chronological)
 * - Filter by activity type
 * - Activity icons and colors
 * - Stage change activities show old → new
 * - Load more pagination
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ACTIVITY_TYPE_LABELS, DEAL_STAGES } from '../../types';
import type { DealWithRelations, DealActivityType } from '../../types';

export interface ActivityTabProps {
  deal: DealWithRelations;
}

const ACTIVITY_COLORS: Record<DealActivityType, string> = {
  created: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  stage_changed: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  value_updated: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  milestone_completed: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  document_uploaded: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  note_added: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  field_updated: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
};

export function ActivityTab({ deal }: ActivityTabProps) {
  const [filterType, setFilterType] = useState<DealActivityType | 'all'>('all');

  const sortedActivities = [...deal.activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const filteredActivities =
    filterType === 'all'
      ? sortedActivities
      : sortedActivities.filter((activity) => activity.activity_type === filterType);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: DealActivityType) => {
    switch (type) {
      case 'created':
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'stage_changed':
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        );
      case 'value_updated':
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'milestone_completed':
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'document_uploaded':
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        );
      case 'note_added':
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
            />
          </svg>
        );
      case 'field_updated':
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
            />
          </svg>
        );
    }
  };

  const renderActivityDescription = (activity: typeof filteredActivities[0]) => {
    if (activity.activity_type === 'stage_changed' && activity.metadata) {
      const { old_stage, new_stage } = activity.metadata;
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span>Stage changed from</span>
          <Badge variant="secondary" className="text-xs">
            {DEAL_STAGES[old_stage as keyof typeof DEAL_STAGES]?.name || old_stage}
          </Badge>
          <span>to</span>
          <Badge variant="secondary" className="text-xs">
            {DEAL_STAGES[new_stage as keyof typeof DEAL_STAGES]?.name || new_stage}
          </Badge>
        </div>
      );
    }

    return <span>{activity.description}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex justify-end">
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as DealActivityType | 'all')}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            {Object.keys(ACTIVITY_TYPE_LABELS).map((type) => (
              <SelectItem key={type} value={type}>
                {ACTIVITY_TYPE_LABELS[type as DealActivityType]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Feed */}
      {filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="mx-auto h-12 w-12 mb-4 text-muted-foreground/40">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-medium">No activities yet</p>
            <p className="text-sm mt-1">Activities will appear here as you work on this deal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />

          {/* Activity Items */}
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="relative pl-14">
                {/* Activity Icon */}
                <div
                  className={`absolute left-0 top-2 h-12 w-12 rounded-full flex items-center justify-center ${
                    ACTIVITY_COLORS[activity.activity_type]
                  }`}
                >
                  <div className="h-6 w-6">{getActivityIcon(activity.activity_type)}</div>
                </div>

                {/* Activity Card */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium">
                            {ACTIVITY_TYPE_LABELS[activity.activity_type]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {renderActivityDescription(activity)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
