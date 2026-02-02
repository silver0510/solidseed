/**
 * DealList Component
 *
 * Displays a list of deals with status indicators and navigation.
 * Shows all deals regardless of status (active, closed_won, closed_lost, etc.).
 *
 * @module features/clients/components/DealList
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Briefcase } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import type { Deal } from '@/features/deals/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the DealList component
 */
export interface DealListProps {
  /** Array of deals to display */
  deals: Deal[];
  /** Client ID (for filtering purposes) */
  clientId: string;
  /** Callback when a deal is modified */
  onDealChanged?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS - Using lucide-react
// =============================================================================

const BriefcaseIcon = Briefcase;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get status badge color based on deal status
 */
function getStatusColor(status: Deal['status']): string {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'pending':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'closed_won':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'closed_lost':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: Deal['status']): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pending':
      return 'Pending';
    case 'closed_won':
      return 'Closed Won';
    case 'closed_lost':
      return 'Closed Lost';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

/**
 * Sort deals by status priority and date (newest first)
 * Priority: active > pending > closed_won/closed_lost > cancelled
 */
function sortDeals(deals: Deal[]): Deal[] {
  const statusPriority: Record<Deal['status'], number> = {
    active: 1,
    pending: 2,
    closed_won: 3,
    closed_lost: 3,
    cancelled: 4,
  };

  return [...deals].sort((a, b) => {
    // Sort by status priority first
    const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Deal list with status indicators
 *
 * @example
 * ```tsx
 * <DealList
 *   deals={deals}
 *   clientId="client-123"
 *   onDealChanged={refetchDeals}
 * />
 * ```
 */
export const DealList: React.FC<DealListProps> = ({
  deals,
  clientId,
  onDealChanged,
  className,
}) => {
  const router = useRouter();

  // Sort deals
  const sortedDeals = sortDeals(deals);

  // Handle deal click - navigate to deal detail
  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  // Empty state
  if (deals.length === 0) {
    return (
      <div className={cn('w-full rounded-lg border border-border bg-card p-8', className)}>
        <div className="flex flex-col items-center justify-center py-4">
          <BriefcaseIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">No deals yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Deals for this client will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Deal Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Stage
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-36">
                Value
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-32">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedDeals.map((deal) => {
              const isInactive = deal.status !== 'active' && deal.status !== 'pending';

              return (
                <tr
                  key={deal.id}
                  data-testid="deal-item"
                  role="article"
                  className={cn(
                    'transition-opacity duration-200 hover:bg-muted/30 cursor-pointer',
                    isInactive && 'opacity-60'
                  )}
                  onClick={() => handleDealClick(deal.id)}
                >
                  {/* Deal Name */}
                  <td className="px-4 py-3">
                    <p className={cn(
                      'text-sm font-medium',
                      isInactive ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {deal.deal_name}
                    </p>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">
                      {deal.deal_type?.type_name || '—'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(deal.status)
                      )}
                    >
                      {getStatusLabel(deal.status)}
                    </span>
                  </td>

                  {/* Stage */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground capitalize">
                      {deal.current_stage.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {deal.deal_value ? formatCurrency(deal.deal_value) : '—'}
                    </span>
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3">
                    <time
                      dateTime={deal.created_at}
                      className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                      {formatDate(deal.created_at)}
                    </time>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealList;
