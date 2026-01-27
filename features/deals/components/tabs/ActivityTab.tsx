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
} from 'lucide-react';
import { ACTIVITY_TYPE_LABELS, DEAL_STAGES } from '../../types';
import type { DealWithRelations, DealActivityType } from '../../types';

export interface ActivityTabProps {
  deal: DealWithRelations;
}

// Color mapping for all activity types (supports both frontend and backend type names)
const ACTIVITY_COLORS: Record<string, string> = {
  // Frontend naming
  created: 'bg-blue-200 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  stage_changed: 'bg-purple-200 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  value_updated: 'bg-green-200 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  milestone_completed: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  document_uploaded: 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  note_added: 'bg-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  field_updated: 'bg-slate-200 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',

  // Backend naming (snake_case from database)
  stage_change: 'bg-purple-200 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  milestone_complete: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  document_upload: 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  document_delete: 'bg-red-200 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  field_update: 'bg-slate-200 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300',
  note: 'bg-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  call: 'bg-cyan-200 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  email: 'bg-sky-200 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  meeting: 'bg-violet-200 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
  showing: 'bg-pink-200 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
  other: 'bg-gray-200 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300',
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
        return <PlusCircle className="w-5 h-5" />;

      case 'stage_changed':
      case 'stage_change':
        return <ArrowRightLeft className="w-5 h-5" />;

      case 'value_updated':
        return <DollarSign className="w-5 h-5" />;

      case 'milestone_completed':
      case 'milestone_complete':
        return <CheckCircle className="w-5 h-5" />;

      case 'document_uploaded':
      case 'document_upload':
        return <Upload className="w-5 h-5" />;

      case 'document_delete':
        return <Trash2 className="w-5 h-5" />;

      case 'note_added':
      case 'note':
        return <StickyNote className="w-5 h-5" />;

      case 'call':
        return <Phone className="w-5 h-5" />;

      case 'email':
        return <Mail className="w-5 h-5" />;

      case 'meeting':
        return <Users className="w-5 h-5" />;

      case 'showing':
        return <Home className="w-5 h-5" />;

      case 'field_updated':
      case 'field_update':
        return <Edit className="w-5 h-5" />;

      case 'other':
      default:
        return <Settings className="w-5 h-5" />;
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
          {/* Timeline */}
          <div className="space-y-0">
            {filteredActivities.map((activity, index) => {
              const isLast = index === filteredActivities.length - 1;

              return (
                <div key={activity.id} className="relative flex gap-4">
                  {/* Time */}
                  <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5 w-16 text-right">
                    {formatDate(activity.created_at)}
                  </div>

                  {/* Timeline Column */}
                  <div className="flex flex-col items-center relative w-3 pt-0.5">
                    {/* Timeline Node */}
                    <div className="relative flex items-center justify-center flex-shrink-0 z-10 mt-0.5">
                      <div
                        className={`h-3 w-3 rounded-full border-2 border-background ${
                          ACTIVITY_COLORS[activity.activity_type]?.split(' ')[0] || 'bg-gray-100'
                        }`}
                      />
                    </div>

                    {/* Timeline Line - Connects from current dot to next dot */}
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-muted-foreground" style={{ minHeight: '2rem' }} />
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 -mt-0.5 pb-8">
                    {/* Activity Header */}
                    <div className="flex items-start gap-3 mb-2">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                          ACTIVITY_COLORS[activity.activity_type] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        <div className="h-5 w-5">{getActivityIcon(activity.activity_type)}</div>
                      </div>

                      {/* Title and Badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {(activity as any).title || ACTIVITY_TYPE_LABELS[activity.activity_type]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {renderActivityDescription(activity) && (
                      <div className="ml-[52px] text-sm text-muted-foreground">
                        {renderActivityDescription(activity)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
