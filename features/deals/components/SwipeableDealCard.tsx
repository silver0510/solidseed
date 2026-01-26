'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Deal } from '@/lib/types/deals';
import { cn } from '@/lib/utils';
import { useSwipe } from '@/hooks/use-swipe';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface SwipeableDealCardProps {
  deal: Deal;
  onClick?: () => void;
  stages: string[];
  currentStageIndex: number;
}

export function SwipeableDealCard({
  deal,
  onClick,
  stages,
  currentStageIndex,
}: SwipeableDealCardProps) {
  const queryClient = useQueryClient();
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);

  const canSwipeLeft = currentStageIndex < stages.length - 1;
  const canSwipeRight = currentStageIndex > 0;

  // Stage change mutation
  const changeStage = useMutation({
    mutationFn: async (newStage: string) => {
      const res = await fetch(`/api/deals/${deal.id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_stage: newStage }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update stage');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });
      toast.success(`Deal moved to ${stages[currentStageIndex]}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update stage');
    },
  });

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (canSwipeLeft && !changeStage.isPending) {
        const nextStage = stages[currentStageIndex + 1];
        if (nextStage) changeStage.mutate(nextStage);
      }
    },
    onSwipeRight: () => {
      if (canSwipeRight && !changeStage.isPending) {
        const prevStage = stages[currentStageIndex - 1];
        if (prevStage) changeStage.mutate(prevStage);
      }
    },
    minSwipeDistance: 80,
  });

  // Track touch position for visual feedback
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSwiping(true);
    swipeHandlers.onTouchStart(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSwiping) {
      const touch = e.touches[0];
      if (touch) {
        const startX = (e.currentTarget as HTMLElement).getBoundingClientRect().left;
        const offset = touch.clientX - startX - (e.currentTarget as HTMLElement).offsetWidth / 2;
        setSwipeOffset(Math.min(100, Math.max(-100, offset / 2)));
      }
    }
    swipeHandlers.onTouchMove(e);
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    setSwipeOffset(0);
    swipeHandlers.onTouchEnd();
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
    <div className="relative">
      {/* Swipe Indicators */}
      {canSwipeRight && (
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center bg-blue-500 text-white rounded-l-lg transition-opacity',
            swipeOffset > 10 ? 'opacity-100' : 'opacity-0'
          )}
        >
          <ChevronRight className="h-6 w-6" />
        </div>
      )}
      {canSwipeLeft && (
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center bg-green-500 text-white rounded-r-lg transition-opacity',
            swipeOffset < -10 ? 'opacity-100' : 'opacity-0'
          )}
        >
          <ChevronLeft className="h-6 w-6" />
        </div>
      )}

      {/* Card */}
      <Card
        className={cn(
          'relative border-l-4 p-3 transition-all touch-none',
          changeStage.isPending && 'opacity-50',
          `border-l-${dealTypeColor}-500`
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
    </div>
  );
}
