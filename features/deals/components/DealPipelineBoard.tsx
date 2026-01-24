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
import { Card } from '@/components/ui/card';
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
import { Loader2, TrendingUp } from 'lucide-react';
import { StageColumn } from './StageColumn';
import { DealCard } from './DealCard';
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
    if (terminalStageModal.isClosedLost && !lostReason.trim()) {
      return; // Require reason for lost deals
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

  return (
    <div className="space-y-4">
      {/* Pipeline Summary */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Pipeline</p>
              <p className="text-xl font-bold">
                {formatCurrency(data.summary.total_pipeline_value)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Expected Commission</p>
            <p className="text-xl font-bold">
              {formatCurrency(data.summary.expected_commission)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Deals</p>
            <p className="text-xl font-bold">{data.summary.active_deals}</p>
          </div>
        </div>
      </Card>

      {/* Deal Type Filter (Optional - can be expanded later) */}
      {/* This would require fetching deal types and showing tabs */}

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
                    stage.deals.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onClick={() => handleDealClick(deal.id)}
                      />
                    ))
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
              <Label htmlFor="lost-reason">Reason for Loss *</Label>
              <Textarea
                id="lost-reason"
                placeholder="e.g., Client chose another agent, financing fell through..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelTerminal}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTerminal}
              disabled={terminalStageModal.isClosedLost && !lostReason.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
