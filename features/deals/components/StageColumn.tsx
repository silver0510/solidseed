'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DealCard } from './DealCard';
import type { PipelineStageData } from '@/lib/types/deals';
import { cn } from '@/lib/utils';

interface StageColumnProps {
  stage: PipelineStageData;
  onDealClick: (dealId: string) => void;
}

export function StageColumn({ stage, onDealClick }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.code,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex min-w-[280px] flex-col md:min-w-[320px]">
      {/* Stage Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{stage.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {stage.count}
          </Badge>
        </div>
        {stage.total_value > 0 && (
          <p className="text-sm font-medium text-muted-foreground">
            {formatCurrency(stage.total_value)}
          </p>
        )}
      </div>

      {/* Droppable Area */}
      <Card
        ref={setNodeRef}
        className={cn(
          'flex-1 border-2 border-dashed bg-muted/20 p-3 transition-colors',
          isOver && 'border-primary bg-primary/5'
        )}
      >
        <ScrollArea className="h-[calc(100vh-240px)]">
          <SortableContext
            items={stage.deals.map((deal) => deal.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3 pr-4">
              {stage.deals.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No deals in this stage
                  </p>
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onClick={() => onDealClick(deal.id)}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </Card>
    </div>
  );
}
