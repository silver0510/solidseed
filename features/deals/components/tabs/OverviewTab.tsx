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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle, XCircle, Flag } from 'lucide-react';
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

export interface OverviewTabProps {
  deal: DealWithRelations;
}

export function OverviewTab({ deal }: OverviewTabProps) {
  const [isChangeStageOpen, setIsChangeStageOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>(deal.current_stage);
  const [completionOutcome, setCompletionOutcome] = useState<'won' | 'lost'>('won');
  const [lostReason, setLostReason] = useState('');
  const { changeStage } = useDealMutations(deal.id);

  // Use pipeline stages from deal type if available
  const pipelineStages = deal.deal_type?.pipeline_stages || [];
  const closedStage = pipelineStages.find(s => s.code === 'closed' || s.code === 'funded');
  const lostStage = pipelineStages.find(s => s.code === 'lost');

  const daysInPipeline = deal.created_at
    ? Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleChangeStage = async () => {
    await changeStage.mutateAsync({
      new_stage: selectedStage,
    });
    setIsChangeStageOpen(false);
  };

  const handleCompleteDeal = async () => {
    if (completionOutcome === 'won' && closedStage) {
      await changeStage.mutateAsync({ new_stage: closedStage.code });
    } else if (completionOutcome === 'lost' && lostStage) {
      await changeStage.mutateAsync({
        new_stage: lostStage.code,
        lost_reason: lostReason || 'No reason provided',
      });
    }
    setIsCompleteDialogOpen(false);
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangeStageOpen(true)}
            >
              Change Stage
            </Button>
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

      {/* Complete Deal Button */}
      {deal.status !== 'closed_won' && deal.status !== 'closed_lost' && (
        <Button
          className="w-full bg-primary hover:bg-primary/90"
          onClick={() => setIsCompleteDialogOpen(true)}
        >
          <Flag className="h-4 w-4 mr-2" />
          Mark Deal as Completed
        </Button>
      )}

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

      {/* Complete Deal Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Deal</DialogTitle>
            <DialogDescription>
              Select the outcome for this deal. This action will close the deal and update its status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup
              value={completionOutcome}
              onValueChange={(value) => setCompletionOutcome(value as 'won' | 'lost')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="won"
                  id="outcome-won"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="outcome-won"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 dark:peer-data-[state=checked]:bg-green-950 cursor-pointer"
                >
                  <CheckCircle className="mb-2 h-6 w-6 text-green-500" />
                  <span className="font-semibold">Won</span>
                  <span className="text-xs text-muted-foreground">Deal closed successfully</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="lost"
                  id="outcome-lost"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="outcome-lost"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-950 cursor-pointer"
                >
                  <XCircle className="mb-2 h-6 w-6 text-red-500" />
                  <span className="font-semibold">Lost</span>
                  <span className="text-xs text-muted-foreground">Deal fell through</span>
                </Label>
              </div>
            </RadioGroup>

            {completionOutcome === 'lost' && (
              <div className="space-y-2">
                <Label htmlFor="lost-reason">Reason for Loss</Label>
                <Textarea
                  id="lost-reason"
                  placeholder="Why was this deal lost? (optional)"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCompleteDialogOpen(false)}
              disabled={changeStage.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteDeal}
              disabled={changeStage.isPending}
              className={completionOutcome === 'won' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {changeStage.isPending ? 'Completing...' : `Mark as ${completionOutcome === 'won' ? 'Won' : 'Lost'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <label className="text-sm font-medium">New Stage</label>
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
    </div>
  );
}
