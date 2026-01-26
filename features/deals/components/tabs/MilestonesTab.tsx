/**
 * MilestonesTab Component
 *
 * Displays:
 * - Timeline view with dates
 * - Completion toggle (pending → completed)
 * - Add new milestone button
 * - Visual timeline with checkmarks for completed
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDealMutations } from '../../hooks/useDealMutations';
import type { DealWithRelations, DealMilestone } from '../../types';

export interface MilestonesTabProps {
  deal: DealWithRelations;
}

export function MilestonesTab({ deal }: MilestonesTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    due_date: '',
  });
  const { toggleMilestone, addMilestone } = useDealMutations(deal.id);

  // Sort by scheduled_date (nulls last), then by created_at
  const sortedMilestones = [...(deal.milestones || [])].sort((a, b) => {
    if (a.scheduled_date && b.scheduled_date) {
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    }
    if (a.scheduled_date) return -1;
    if (b.scheduled_date) return 1;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const handleToggleComplete = async (milestoneId: string, currentStatus: string) => {
    await toggleMilestone.mutateAsync({
      milestoneId,
      completed: currentStatus === 'pending',
    });
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.name) return;

    await addMilestone.mutateAsync({
      name: newMilestone.name,
      due_date: newMilestone.due_date || undefined,
    });

    setNewMilestone({ name: '', due_date: '' });
    setIsAddDialogOpen(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isPastDue = (scheduledDate: string | null, status: string) => {
    if (!scheduledDate || status === 'completed') return false;
    return new Date(scheduledDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Add Milestone Button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <svg
            className="h-3.5 w-3.5 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Milestone
        </Button>
      </div>

      {/* Milestones Timeline */}
      {sortedMilestones.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <div className="mx-auto h-10 w-10 mb-3 text-muted-foreground/40">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium">No milestones yet</p>
            <p className="text-xs mt-1">Add milestones to track progress</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-border" />

          {/* Milestone Cards */}
          <div className="space-y-2">
            {sortedMilestones.map((milestone) => (
              <div key={milestone.id} className="relative pl-9">
                {/* Timeline Dot */}
                <div
                  className={`absolute left-0 top-2.5 h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    milestone.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : isPastDue(milestone.scheduled_date, milestone.status)
                      ? 'bg-red-100 border-red-500 text-red-500 dark:bg-red-900/30'
                      : 'bg-background border-border'
                  }`}
                >
                  {milestone.status === 'completed' ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted" />
                  )}
                </div>

                {/* Milestone Card */}
                <Card
                  className={`transition-all ${
                    milestone.status === 'completed' ? 'opacity-75' : ''
                  }`}
                >
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`milestone-${milestone.id}`}
                        checked={milestone.status === 'completed'}
                        onCheckedChange={() =>
                          handleToggleComplete(milestone.id, milestone.status)
                        }
                        disabled={toggleMilestone.isPending}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor={`milestone-${milestone.id}`}
                            className={`text-sm font-medium cursor-pointer truncate ${
                              milestone.status === 'completed'
                                ? 'line-through text-muted-foreground'
                                : ''
                            }`}
                          >
                            {milestone.milestone_name}
                          </label>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                            {milestone.scheduled_date && (
                              <span
                                className={
                                  isPastDue(milestone.scheduled_date, milestone.status)
                                    ? 'text-destructive font-medium'
                                    : ''
                                }
                              >
                                {formatDate(milestone.scheduled_date)}
                              </span>
                            )}
                            {milestone.completed_date && (
                              <span className="text-green-600 dark:text-green-400">
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Milestone Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
            <DialogDescription>
              Create a new milestone to track progress on this deal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-name">
                Milestone Name
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="milestone-name"
                value={newMilestone.name}
                onChange={(e) =>
                  setNewMilestone((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Inspection completed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-due-date">Due Date</Label>
              <Input
                id="milestone-due-date"
                type="date"
                value={newMilestone.due_date}
                onChange={(e) =>
                  setNewMilestone((prev) => ({ ...prev, due_date: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={addMilestone.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMilestone}
              disabled={!newMilestone.name || addMilestone.isPending}
            >
              {addMilestone.isPending ? 'Adding...' : 'Add Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
