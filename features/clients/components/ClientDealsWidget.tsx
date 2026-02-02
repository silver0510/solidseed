/**
 * ClientDealsWidget Component
 *
 * Displays active deals for a client with type icon, stage badge, value, and
 * expected close date. Includes "Add Deal" and "View All Deals" actions.
 *
 * @module features/clients/components/ClientDealsWidget
 */

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Home, Calculator, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useClientDeals } from '../hooks/useClientDeals';
import type { ClientDeal } from '../hooks/useClientDeals';

/**
 * Props for the ClientDealsWidget component
 */
export interface ClientDealsWidgetProps {
  /** ID of the client */
  clientId: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS - Using lucide-react
// =============================================================================

const HomeIcon = Home;
const CalculatorIcon = Calculator;
const PlusIcon = Plus;
const LoadingSpinner = Loader2;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get icon component for deal type
 */
const getDealTypeIcon = (typeCode?: string) => {
  switch (typeCode) {
    case 'residential_sale':
      return HomeIcon;
    case 'mortgage':
      return CalculatorIcon;
    default:
      return HomeIcon;
  }
};

/**
 * Format currency value
 */
const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date to readable string
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';

  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Get stage display name (capitalize and format)
 */
const formatStageName = (stage: string): string => {
  return stage
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Individual deal item component
 */
const DealItem: React.FC<{ deal: ClientDeal }> = ({ deal }) => {
  const DealIcon = getDealTypeIcon(deal.deal_type?.type_code);
  const iconColor = deal.deal_type?.color || '#3B82F6';

  return (
    <Link
      href={`/deals/${deal.id}`}
      className={cn(
        'block p-3 rounded-lg border border-border',
        'hover:bg-accent hover:shadow-sm transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Deal Type Icon */}
        <div
          className="flex-shrink-0 mt-0.5"
          style={{ color: iconColor }}
          aria-hidden="true"
        >
          <DealIcon className="h-4 w-4" />
        </div>

        {/* Deal Info */}
        <div className="flex-1 min-w-0">
          {/* Deal Name */}
          <h4 className="text-sm font-medium text-foreground truncate mb-1">
            {deal.deal_name}
          </h4>

          {/* Stage and Value */}
          <div className="flex items-center gap-2 mb-1.5">
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {formatStageName(deal.current_stage)}
            </Badge>
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(deal.deal_value)}
            </span>
          </div>

          {/* Expected Close */}
          <p className="text-xs text-muted-foreground">
            Close: {formatDate(deal.expected_close_date)}
          </p>
        </div>
      </div>
    </Link>
  );
};

/**
 * Empty state component
 */
const EmptyState: React.FC<{ clientId: string }> = ({ clientId }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <div className="text-muted-foreground/50 mb-3">
      <HomeIcon className="h-12 w-12" />
    </div>
    <p className="text-sm text-foreground font-medium mb-1">No active deals</p>
    <p className="text-xs text-muted-foreground mb-4 text-center">
      Create a new deal to start tracking this client's transactions
    </p>
    <Link href={`/deals/new?client_id=${clientId}`}>
      <Button size="sm" variant="outline">
        <PlusIcon className="h-4 w-4 mr-1.5" />
        Add Deal
      </Button>
    </Link>
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ClientDealsWidget displays active deals for a client
 *
 * @example
 * ```tsx
 * <ClientDealsWidget clientId="cl123" />
 * ```
 */
export const ClientDealsWidget: React.FC<ClientDealsWidgetProps> = ({
  clientId,
  className,
}) => {
  const { deals, totalCount, isLoading, error } = useClientDeals({
    clientId,
    limit: 10,
    activeOnly: true,
  });

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Active Deals
            {!isLoading && totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({totalCount})
              </span>
            )}
          </CardTitle>

          {!isLoading && deals.length > 0 && (
            <Link href={`/deals/new?client_id=${clientId}`}>
              <Button size="sm" variant="ghost">
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Add Deal
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="h-6 w-6 text-primary" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-6 px-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && deals.length === 0 && (
          <EmptyState clientId={clientId} />
        )}

        {/* Deals List */}
        {!isLoading && !error && deals.length > 0 && (
          <div className="space-y-2">
            {deals.map((deal) => (
              <DealItem key={deal.id} deal={deal} />
            ))}

            {/* View All Link */}
            {totalCount > deals.length && (
              <div className="pt-2 text-center border-t border-border">
                <Link
                  href={`/deals?client_id=${clientId}`}
                  className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  View All Deals ({totalCount})
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientDealsWidget;
