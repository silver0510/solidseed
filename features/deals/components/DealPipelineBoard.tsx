'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, TrendingUp, DollarSign, LayoutGrid, LayoutList, List } from 'lucide-react';
import { StageColumn } from './StageColumn';
import { DealCard } from './DealCard';
import { SwipeableDealCard } from './SwipeableDealCard';
import { usePipelineDeals } from '../hooks/usePipelineDeals';
import { useDealDragDrop } from '../hooks/useDealDragDrop';
import type { Deal } from '@/lib/types/deals';

interface DealPipelineBoardProps {
  dealTypeId?: string;
  userId?: string;
}

export function DealPipelineBoard({ dealTypeId, userId }: DealPipelineBoardProps) {
  const router = useRouter();
  const [selectedDealTypeId, setSelectedDealTypeId] = React.useState<string | undefined>(
    dealTypeId
  );
  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);
  const [lostReason, setLostReason] = React.useState('');

  // Fetch pipeline data
  const { data } = usePipelineDeals({
    dealTypeId: selectedDealTypeId,
    assignedTo: userId,
  });

  // Drag and drop logic
  const {
    handleDragEnd,
    terminalStageModal,
    closeTerminalModal,
    confirmTerminalStage,
  } = useDealDragDrop();

  // Handle swipe stage change (for mobile SwipeableDealCard)
  // This simulates a drag event to reuse the terminal stage logic
  const handleSwipeStageChange = React.useCallback((dealId: string, newStage: string) => {
    // Create a synthetic drag event to trigger the same flow as drag & drop
    const syntheticEvent = {
      active: { id: dealId },
      over: { id: newStage },
    };
    handleDragEnd(syntheticEvent as any);
  }, [handleDragEnd]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  // Handle deal click - navigate to deal detail
  const handleDealClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  // Handle terminal stage confirmation
  const handleConfirmTerminal = () => {
    if (terminalStageModal.isClosedLost && (!lostReason.trim() || lostReason.trim().length < 10)) {
      return; // Require reason with minimum 10 characters for lost deals
    }
    confirmTerminalStage(lostReason);
    setLostReason('');
  };

  // Handle terminal stage cancel
  const handleCancelTerminal = () => {
    closeTerminalModal();
    setLostReason('');
  };

  // Track active dragged deal for overlay
  const handleDragStart = (event: any) => {
    const dealId = String(event.active.id);
    let foundDeal: Deal | null = null;

    for (const stage of data.stages) {
      const deal = stage.deals.find((d) => d.id === dealId);
      if (deal) {
        foundDeal = deal;
        break;
      }
    }

    setActiveDeal(foundDeal);
  };

  const handleDragEndWithReset = (event: any) => {
    handleDragEnd(event);
    setActiveDeal(null);
  };

  // Format currency for summary
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Handle loading or missing data
  if (!data || !data.summary || !data.stages) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if there are any deals across all stages
  const totalDeals = data.stages.reduce((sum, stage) => sum + stage.deals.length, 0);

  // Show "No deals found" message if there are no deals
  if (totalDeals === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No deals found.
      </div>
    );
  }

  return (
    <>
      {/* Desktop View: Horizontal Columns */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEndWithReset}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {data.stages.map((stage) => (
              <StageColumn
                key={stage.code}
                stage={stage}
                onDealClick={handleDealClick}
              />
            ))}
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeDeal ? <DealCard deal={activeDeal} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile View: Accordion */}
      <div className="md:hidden">
        <Accordion type="single" collapsible className="space-y-2">
          {data.stages.map((stage) => (
            <AccordionItem
              key={stage.code}
              value={stage.code}
              className="rounded-lg border bg-card"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex w-full items-center justify-between pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{stage.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stage.count}
                    </Badge>
                  </div>
                  {stage.total_value > 0 && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatCurrency(stage.total_value)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {stage.deals.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      No deals in this stage
                    </p>
                  ) : (
                    stage.deals.map((deal) => {
                      const stageIndex = data.stages.findIndex((s) => s.code === stage.code);
                      const allStages = data.stages.map((s) => s.code);
                      return (
                        <SwipeableDealCard
                          key={deal.id}
                          deal={deal}
                          onClick={() => handleDealClick(deal.id)}
                          stages={allStages}
                          currentStageIndex={stageIndex}
                          onStageChange={handleSwipeStageChange}
                        />
                      );
                    })
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Terminal Stage Modal (Close Won/Lost) */}
      <Dialog open={terminalStageModal.isOpen} onOpenChange={handleCancelTerminal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {terminalStageModal.isClosedLost ? 'Mark Deal as Lost' : 'Mark Deal as Won'}
            </DialogTitle>
            <DialogDescription>
              {terminalStageModal.isClosedLost
                ? `You are marking "${terminalStageModal.dealName}" as lost. Please provide a reason.`
                : `You are marking "${terminalStageModal.dealName}" as won. This will close the deal.`}
            </DialogDescription>
          </DialogHeader>

          {terminalStageModal.isClosedLost && (
            <div className="space-y-2">
              <Label htmlFor="lost-reason">
                Reason for losing <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="lost-reason"
                placeholder="Enter the reason why this deal was lost (minimum 10 characters)"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="min-h-[100px]"
              />
              {lostReason.length > 0 && lostReason.length < 10 && (
                <p className="text-sm text-destructive">
                  Please enter at least 10 characters ({10 - lostReason.length} more needed)
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelTerminal}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTerminal}
              disabled={terminalStageModal.isClosedLost && lostReason.trim().length < 10}
            >
              {terminalStageModal.isClosedLost ? 'Mark as Lost' : 'Mark as Won'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
