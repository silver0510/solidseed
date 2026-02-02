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
import {
  PlusCircle,
  ArrowRightLeft,
  DollarSign,
  CheckCircle,
  Upload,
  Trash2,
  StickyNote,
  Phone,
  Mail,
  Users,
  Home,
  Edit,
  Settings,
  Clock,
} from 'lucide-react';
import { ACTIVITY_TYPE_LABELS, DEAL_STAGES } from '../../types';
import type { DealWithRelations, DealActivityType } from '../../types';

export interface ActivityTabProps {
  deal: DealWithRelations;
}

// Color mapping for all activity types (supports both frontend and backend type names)
const ACTIVITY_COLORS: Record<string, string> = {
  // Frontend naming
  created: 'bg-blue-200 text-blue-700 dark:bg-blue-800/50 dark:text-blue-200',
  stage_changed: 'bg-purple-200 text-purple-700 dark:bg-purple-800/50 dark:text-purple-200',
  value_updated: 'bg-green-200 text-green-700 dark:bg-green-800/50 dark:text-green-200',
  milestone_completed: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-200',
  document_uploaded: 'bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200',
  note_added: 'bg-indigo-200 text-indigo-700 dark:bg-indigo-800/50 dark:text-indigo-200',
  field_updated: 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200',

  // Backend naming (snake_case from database)
  stage_change: 'bg-purple-200 text-purple-700 dark:bg-purple-800/50 dark:text-purple-200',
  milestone_complete: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-200',
  document_upload: 'bg-amber-200 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200',
  document_delete: 'bg-red-200 text-red-700 dark:bg-red-800/50 dark:text-red-200',
  field_update: 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-200',
  note: 'bg-indigo-200 text-indigo-700 dark:bg-indigo-800/50 dark:text-indigo-200',
  call: 'bg-cyan-200 text-cyan-700 dark:bg-cyan-800/50 dark:text-cyan-200',
  email: 'bg-sky-200 text-sky-700 dark:bg-sky-800/50 dark:text-sky-200',
  meeting: 'bg-violet-200 text-violet-700 dark:bg-violet-800/50 dark:text-violet-200',
  showing: 'bg-pink-200 text-pink-700 dark:bg-pink-800/50 dark:text-pink-200',
  other: 'bg-gray-200 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200',
};

export function ActivityTab({ deal }: ActivityTabProps) {
  const [filterType, setFilterType] = useState<DealActivityType | 'all'>('all');

  const sortedActivities = [...(deal.activities || [])].sort(
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

  const getActivityIcon = (type: string) => {
    // Handle both frontend and backend activity type names
    switch (type) {
      case 'created':
        return <PlusCircle className="w-5 h-5" strokeWidth={2.5} />;

      case 'stage_changed':
      case 'stage_change':
        return <ArrowRightLeft className="w-5 h-5" strokeWidth={2.5} />;

      case 'value_updated':
        return <DollarSign className="w-5 h-5" strokeWidth={2.5} />;

      case 'milestone_completed':
      case 'milestone_complete':
        return <CheckCircle className="w-5 h-5" strokeWidth={2.5} />;

      case 'document_uploaded':
      case 'document_upload':
        return <Upload className="w-5 h-5" strokeWidth={2.5} />;

      case 'document_delete':
        return <Trash2 className="w-5 h-5" strokeWidth={2.5} />;

      case 'note_added':
      case 'note':
        return <StickyNote className="w-5 h-5" strokeWidth={2.5} />;

      case 'call':
        return <Phone className="w-5 h-5" strokeWidth={2.5} />;

      case 'email':
        return <Mail className="w-5 h-5" strokeWidth={2.5} />;

      case 'meeting':
        return <Users className="w-5 h-5" strokeWidth={2.5} />;

      case 'showing':
        return <Home className="w-5 h-5" strokeWidth={2.5} />;

      case 'field_updated':
      case 'field_update':
        return <Edit className="w-5 h-5" strokeWidth={2.5} />;

      case 'other':
      default:
        return <Settings className="w-5 h-5" strokeWidth={2.5} />;
    }
  };

  const renderActivityDescription = (activity: typeof filteredActivities[0]) => {
    // Stage changes show old → new with badges
    if (activity.activity_type === 'stage_changed') {
      // Try to get stages from old_stage/new_stage fields first
      const oldStage = (activity as any).old_stage;
      const newStage = (activity as any).new_stage;

      if (oldStage && newStage) {
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span>Moved from</span>
            <Badge variant="secondary" className="text-xs">
              {DEAL_STAGES[oldStage as keyof typeof DEAL_STAGES]?.name || oldStage}
            </Badge>
            <span>to</span>
            <Badge variant="secondary" className="text-xs">
              {DEAL_STAGES[newStage as keyof typeof DEAL_STAGES]?.name || newStage}
            </Badge>
          </div>
        );
      }

      // Fallback to description if no stage fields
      if (activity.description) {
        return <span className="text-sm">{activity.description}</span>;
      }
    }

    // For all other activities, show description if available
    if (activity.description) {
      return <span className="text-sm">{activity.description}</span>;
    }

    // No description available
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex justify-end">
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as DealActivityType | 'all')}
        >
          <SelectTrigger className="w-select-lg">
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
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="mt-4 font-medium text-muted-foreground">No activities yet</p>
          <p className="text-sm text-muted-foreground mt-1">Activities will appear here as you work on this deal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity, index) => (
            <div key={activity.id} className="relative">
              {/* Timeline line */}
              {index < filteredActivities.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
              )}

              {/* Timeline item */}
              <div className="flex gap-3">
                {/* Icon */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-200 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200'
                  }`}
                >
                  {getActivityIcon(activity.activity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {(activity as any).title || ACTIVITY_TYPE_LABELS[activity.activity_type]}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(activity.created_at)}
                    </span>
                  </div>
                  {renderActivityDescription(activity) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {renderActivityDescription(activity)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
