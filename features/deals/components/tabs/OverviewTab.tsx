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
import { DEAL_STAGES } from '../../types';
import type { DealWithRelations, DealStage } from '../../types';

export interface OverviewTabProps {
  deal: DealWithRelations;
}

const STAGE_ORDER: DealStage[] = [
  'lead',
  'qualified',
  'contract_sent',
  'contract_signed',
  'pending',
  'closed_won',
  'closed_lost',
];

export function OverviewTab({ deal }: OverviewTabProps) {
  const [isChangeStageOpen, setIsChangeStageOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<DealStage>(deal.stage);
  const { changeStage } = useDealMutations(deal.id);

  const currentStageIndex = STAGE_ORDER.indexOf(deal.stage);
  const progressPercentage = ((currentStageIndex + 1) / STAGE_ORDER.length) * 100;

  const daysInPipeline = deal.created_at
    ? Math.floor((Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleChangeStage = async () => {
    await changeStage.mutateAsync({
      stage: selectedStage,
    });
    setIsChangeStageOpen(false);
  };

  const handleMarkWon = async () => {
    await changeStage.mutateAsync({
      stage: 'closed_won',
    });
  };

  const handleMarkLost = async () => {
    await changeStage.mutateAsync({
      stage: 'closed_lost',
    });
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
                  backgroundColor: `${DEAL_STAGES[deal.stage].color}20`,
                  color: DEAL_STAGES[deal.stage].color,
                  borderColor: `${DEAL_STAGES[deal.stage].color}40`,
                }}
              >
                {DEAL_STAGES[deal.stage].name}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {DEAL_STAGES[deal.stage].description}
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
              <span>Lead</span>
              <span>Closed</span>
            </div>
          </div>

          {/* Stage Timeline */}
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mt-4">
            {STAGE_ORDER.slice(0, -2).map((stage, index) => {
              const isPast = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              return (
                <div
                  key={stage}
                  className={`text-center p-2 rounded-lg text-xs ${
                    isCurrent
                      ? 'bg-primary text-primary-foreground font-medium'
                      : isPast
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {DEAL_STAGES[stage].name}
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
              <p className="text-2xl font-semibold mt-1">{formatCurrency(deal.value)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission Rate</p>
              <p className="text-2xl font-semibold mt-1">{deal.commission_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(deal.commission_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agent Commission</p>
              <p className="text-2xl font-semibold mt-1">
                {formatCurrency(deal.agent_commission)}
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
              disabled={deal.stage === 'closed_won' || changeStage.isPending}
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
              disabled={deal.stage === 'closed_lost' || changeStage.isPending}
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
                onValueChange={(value) => setSelectedStage(value as DealStage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {DEAL_STAGES[stage].name}
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
              disabled={changeStage.isPending || selectedStage === deal.stage}
            >
              {changeStage.isPending ? 'Updating...' : 'Update Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
