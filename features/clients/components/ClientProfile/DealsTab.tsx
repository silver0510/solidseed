/**
 * DealsTab Component
 *
 * Displays all deals for a client (all statuses, not just active).
 *
 * @module features/clients/components/ClientProfile/DealsTab
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { DealList } from '../DealList';
import type { Deal } from '@/features/deals/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the DealsTab component
 */
export interface DealsTabProps {
  /** Client ID */
  clientId: string;
  /** Array of deals to display */
  deals: Deal[];
  /** Callback when a deal is created or modified */
  onDealChanged?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client deals tab with list view
 *
 * @example
 * ```tsx
 * <DealsTab
 *   clientId="cl123"
 *   deals={deals}
 *   onDealChanged={refetchDeals}
 * />
 * ```
 */
export const DealsTab: React.FC<DealsTabProps> = ({
  clientId,
  deals,
  onDealChanged,
  className,
}) => {
  const router = useRouter();

  const handleAddDeal = () => {
    // Navigate to deals page with client pre-selected
    router.push(`/deals/new?client_id=${clientId}`);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Deal Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddDeal}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span>Add Deal</span>
        </button>
      </div>

      {/* Deals List */}
      <DealList
        deals={deals}
        clientId={clientId}
        onDealChanged={onDealChanged}
      />
    </div>
  );
};

export default DealsTab;
