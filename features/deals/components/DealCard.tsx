'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Deal } from '@/lib/types/deals';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  onClick?: () => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Format currency
  const formatCurrency = (value: number | null) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get deal type color (fallback to blue if not set)
  const dealTypeColor = deal.deal_type?.color || 'blue';

  // Calculate days in current stage
  const daysInStage = deal.days_in_pipeline || 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative cursor-grab border-l-4 p-3 transition-all hover:shadow-md active:cursor-grabbing',
        isDragging && 'z-50 opacity-50 shadow-2xl',
        `border-l-${dealTypeColor}-500`
      )}
      onClick={onClick}
    >
      {/* Deal Name */}
      <h4 className="mb-2 line-clamp-2 text-sm font-semibold">
        {deal.deal_name}
      </h4>

      {/* Client Info */}
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <User className="h-3 w-3" />
        <span className="truncate">{deal.client?.name || 'Unknown Client'}</span>
      </div>

      {/* Deal Value */}
      {deal.deal_value && (
        <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
          <DollarSign className="h-3 w-3" />
          <span>{formatCurrency(deal.deal_value)}</span>
        </div>
      )}

      {/* Expected Close Date */}
      {deal.expected_close_date && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {formatDistanceToNow(new Date(deal.expected_close_date), {
              addSuffix: true,
            })}
          </span>
        </div>
      )}

      {/* Footer: Deal Type Badge & Days in Stage */}
      <div className="flex items-center justify-between gap-2">
        {deal.deal_type && (
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              `border-${dealTypeColor}-200 bg-${dealTypeColor}-50 text-${dealTypeColor}-700`
            )}
          >
            {deal.deal_type.icon && (
              <span className="mr-1">{deal.deal_type.icon}</span>
            )}
            {deal.deal_type.type_name}
          </Badge>
        )}
        {daysInStage > 0 && (
          <span className="text-xs text-muted-foreground">
            {daysInStage}d
          </span>
        )}
      </div>
    </Card>
  );
}
