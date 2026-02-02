/**
 * OverviewTab Component
 *
 * Displays:
 * - Stage progress bar (visual pipeline)
 * - Financial summary (value, commission rate, commission amount, agent commission)
 * - Key dates (expected close, actual close, days in pipeline)
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDealMutations } from '../../hooks/useDealMutations';
import type { DealWithRelations } from '../../types';
import { DealStagePipeline } from '../DealStagePipeline';
import { getDaysInPipeline } from '@/lib/utils/formatters';

export interface OverviewTabProps {
  deal: DealWithRelations;
}

export function OverviewTab({ deal }: OverviewTabProps) {
  const [isChangeStageOpen, setIsChangeStageOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>(deal.current_stage);
  const [isMarkAsLostOpen, setIsMarkAsLostOpen] = useState(false);
  const [terminalStageModal, setTerminalStageModal] = useState<{
    isOpen: boolean;
    newStage: string | null;
  }>({
    isOpen: false,
    newStage: null,
  });
  const [lostReason, setLostReason] = useState('');
  const { changeStage, markAsLost } = useDealMutations(deal.id);

  // Use pipeline stages from deal type if available
  const pipelineStages = deal.deal_type?.pipeline_stages || [];

  const daysInPipeline = deal.created_at ? getDaysInPipeline(deal.created_at) : 0;

  const handleChangeStage = async () => {
    // Check if new stage is terminal "won" stage
    const currentStageInfo = pipelineStages.find(s => s.code === selectedStage);

    if (!currentStageInfo) {
      // Stage doesn't exist in this pipeline, shouldn't happen but handle gracefully
      setIsChangeStageOpen(false);
      return;
    }

    // Use type field if available, otherwise fall back to hardcoded logic for backward compatibility
    const stageType = currentStageInfo.type;
    const isClosedWon = stageType === 'won' || selectedStage === 'closed' || selectedStage === 'funded';

    // Close the change stage dialog first
    setIsChangeStageOpen(false);

    if (isClosedWon) {
      // Show terminal stage modal for won deals
      setTerminalStageModal({
        isOpen: true,
        newStage: selectedStage,
      });
    } else {
      // Non-terminal stage, update immediately
      await changeStage.mutateAsync({ new_stage: selectedStage });
    }
  };

  const closeTerminalModal = () => {
    setTerminalStageModal({
      isOpen: false,
      newStage: null,
    });
  };

  const confirmTerminalStage = async () => {
    if (!terminalStageModal.newStage) return;

    await changeStage.mutateAsync({
      new_stage: terminalStageModal.newStage,
    });

    closeTerminalModal();
  };

  const handleMarkAsLost = async () => {
    if (!lostReason.trim() || lostReason.trim().length < 10) {
      return;
    }

    await markAsLost.mutateAsync({ lost_reason: lostReason });
    setIsMarkAsLostOpen(false);
    setLostReason('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Stage Progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Deal Stage</CardTitle>
            <div className="flex gap-2">
              {deal.status !== 'closed_won' && deal.status !== 'closed_lost' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangeStageOpen(true)}
                  >
                    Change Stage
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsMarkAsLostOpen(true)}
                  >
                    Mark as Lost
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <DealStagePipeline
            stages={pipelineStages}
            currentStage={deal.current_stage}
            dealTypeColor={deal.deal_type?.color}
          />
        </CardContent>
      </Card>

      {/* Financial Summary & Key Dates - Side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Financials</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Deal Value</p>
                <p className="text-lg font-semibold">{formatCurrency(deal.deal_value || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Commission Rate</p>
                <p className="text-lg font-semibold">{deal.commission_rate || 0}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Commission</p>
                <p className="text-lg font-semibold">{formatCurrency(deal.commission_amount || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Agent Commission</p>
                <p className="text-lg font-semibold">{formatCurrency(deal.agent_commission || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Dates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key Dates</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Expected Close</p>
                <p className="text-lg font-semibold">{formatDate(deal.expected_close_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Actual Close</p>
                <p className="text-lg font-semibold">{formatDate(deal.actual_close_date)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Days in Pipeline</p>
                <p className="text-lg font-semibold">{daysInPipeline} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lost Reason Display */}
      {deal.status === 'closed_lost' && deal.lost_reason && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Reason for Loss</p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{deal.lost_reason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Stage Dialog */}
      <Dialog open={isChangeStageOpen} onOpenChange={setIsChangeStageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Deal Stage</DialogTitle>
            <DialogDescription>
              Select the new stage for this deal. This will be logged in the activity feed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">New Stage</Label>
              <Select
                value={selectedStage}
                onValueChange={(value) => setSelectedStage(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pipelineStages.map((stage) => (
                    <SelectItem key={stage.code} value={stage.code}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeStageOpen(false)}
              disabled={changeStage.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeStage}
              disabled={changeStage.isPending || selectedStage === deal.current_stage}
            >
              {changeStage.isPending ? 'Updating...' : 'Update Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminal "Won" Stage Confirmation Modal */}
      <Dialog open={terminalStageModal.isOpen} onOpenChange={(open) => !open && closeTerminalModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Won</DialogTitle>
            <DialogDescription>
              You are about to mark &ldquo;{deal.deal_name}&rdquo; as won. This will close the deal.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={closeTerminalModal}>
              Cancel
            </Button>
            <Button onClick={confirmTerminalStage}>
              Mark as Won
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Lost Dialog */}
      <Dialog open={isMarkAsLostOpen} onOpenChange={setIsMarkAsLostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Deal as Lost</DialogTitle>
            <DialogDescription>
              You are about to mark &ldquo;{deal.deal_name}&rdquo; as lost. Please provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="lost-reason">
              Reason for losing <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="lost-reason"
              placeholder="Enter the reason why this deal was lost (minimum 10 characters)"
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="min-h-card-min"
            />
            {lostReason.length > 0 && lostReason.length < 10 && (
              <p className="text-sm text-destructive">
                Please enter at least 10 characters ({10 - lostReason.length} more needed)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMarkAsLostOpen(false);
                setLostReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkAsLost}
              disabled={markAsLost.isPending || lostReason.trim().length < 10}
            >
              {markAsLost.isPending ? 'Marking as Lost...' : 'Mark as Lost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
