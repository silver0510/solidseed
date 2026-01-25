/**
 * OverviewTab Component
 *
 * Displays:
 * - Stage progress bar (visual pipeline)
 * - Financial summary (value, commission rate, commission amount, agent commission)
 * - Key dates (expected close, actual close, days in pipeline)
 * - Quick actions (change stage, mark won/lost)
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export interface OverviewTabProps {
  deal: DealWithRelations;
}

export function OverviewTab({ deal }: OverviewTabProps) {
  const [isChangeStageOpen, setIsChangeStageOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>(deal.current_stage);
  const { changeStage } = useDealMutations(deal.id);

  // Use pipeline stages from deal type if available
  const pipelineStages = deal.deal_type?.pipeline_stages || [];
  const currentStageIndex = pipelineStages.findIndex(s => s.code === deal.current_stage);
  const progressPercentage = pipelineStages.length > 0
    ? ((currentStageIndex + 1) / pipelineStages.length) * 100
    : 0;

  // Get current stage info
  const currentStageInfo = pipelineStages.find(s => s.code === deal.current_stage);

  const daysInPipeline = deal.created_at
    ? Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleChangeStage = async () => {
    await changeStage.mutateAsync({
      new_stage: selectedStage,
    });
    setIsChangeStageOpen(false);
  };

  // Find terminal stages (closed/funded/lost) from pipeline
  const closedStage = pipelineStages.find(s => s.code === 'closed' || s.code === 'funded');
  const lostStage = pipelineStages.find(s => s.code === 'lost');

  const handleMarkWon = async () => {
    if (closedStage) {
      await changeStage.mutateAsync({
        new_stage: closedStage.code,
      });
    }
  };

  const handleMarkLost = async () => {
    if (lostStage) {
      await changeStage.mutateAsync({
        new_stage: lostStage.code,
        lost_reason: 'Marked as lost from deal detail page',
      });
    }
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
        <CardHeader>
          <CardTitle className="text-lg">Deal Stage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Stage Badge */}
          <div className="flex items-center justify-between">
            <div>
              <Badge
                variant="secondary"
                className="text-sm font-medium"
                style={{
                  backgroundColor: `${deal.deal_type?.color || '#3b82f6'}20`,
                  color: deal.deal_type?.color || '#3b82f6',
                  borderColor: `${deal.deal_type?.color || '#3b82f6'}40`,
                }}
              >
                {currentStageInfo?.name || deal.current_stage}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {deal.deal_type?.type_name || 'Deal'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangeStageOpen(true)}
            >
              Change Stage
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{pipelineStages[0]?.name || 'Start'}</span>
              <span>{pipelineStages[pipelineStages.length - 1]?.name || 'End'}</span>
            </div>
          </div>

          {/* Stage Timeline */}
          <div className={`grid grid-cols-3 md:grid-cols-${Math.min(pipelineStages.length, 7)} gap-2 mt-4`}>
            {pipelineStages.map((stage, index) => {
              const isPast = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              return (
                <div
                  key={stage.code}
                  className={`text-center p-2 rounded-lg text-xs ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground font-medium'
                      : isPast
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stage.name}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Deal Value</p>
              <p className="text-2xl font-semibold mt-1">{formatCurrency(deal.deal_value || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="text-2xl font-semibold mt-1">{deal.commission_rate || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(deal.commission_amount || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agent Commission</p>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(deal.agent_commission || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Expected Close Date</p>
              <p className="text-lg font-medium mt-1">
                {formatDate(deal.expected_close_date)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual Close Date</p>
              <p className="text-lg font-medium mt-1">{formatDate(deal.actual_close_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days in Pipeline</p>
              <p className="text-lg font-medium mt-1">{daysInPipeline} days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="default"
              onClick={handleMarkWon}
              disabled={deal.status === 'closed_won' || changeStage.isPending}
              className="flex-1"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Mark as Won
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkLost}
              disabled={deal.status === 'closed_lost' || changeStage.isPending}
              className="flex-1"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Mark as Lost
            </Button>
          </div>
        </CardContent>
      </Card>

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
