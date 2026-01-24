/**
 * DealBadge Component
 *
 * Displays a color-coded badge showing the number of active deals for a client.
 * Color coding: Green (1-2), Amber (3-5), Red (6+)
 *
 * @module features/clients/components/DealBadge
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

/**
 * Props for the DealBadge component
 */
export interface DealBadgeProps {
  /** Number of active deals */
  dealCount: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * DealBadge displays a color-coded badge with the number of active deals.
 *
 * Color coding:
 * - Green: 1-2 deals (low)
 * - Amber: 3-5 deals (medium)
 * - Red: 6+ deals (high)
 *
 * @param props - Component props
 * @returns React component
 *
 * @example
 * ```tsx
 * <DealBadge dealCount={3} />
 * ```
 */
export const DealBadge: React.FC<DealBadgeProps> = ({ dealCount, className }) => {
  if (dealCount === 0) {
    return null;
  }

  // Determine color based on count
  const getVariant = (): 'default' | 'secondary' | 'destructive' => {
    if (dealCount <= 2) return 'secondary'; // Green
    if (dealCount <= 5) return 'default'; // Amber
    return 'destructive'; // Red
  };

  const getColorClasses = (): string => {
    if (dealCount <= 2) return 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300';
    if (dealCount <= 5) return 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900 dark:text-amber-300';
    return 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300';
  };

  return (
    <Badge
      variant={getVariant()}
      className={cn(
        'h-6 w-6 flex items-center justify-center rounded-full p-0 text-xs font-semibold',
        getColorClasses(),
        className
      )}
      aria-label={`${dealCount} active deal${dealCount === 1 ? '' : 's'}`}
    >
      {dealCount}
    </Badge>
  );
};

export default DealBadge;
