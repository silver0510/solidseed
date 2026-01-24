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

  const sortedMilestones = [...deal.milestones].sort(
    (a, b) => a.display_order - b.display_order
  );

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

  const isPastDue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Add Milestone Button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <svg
            className="h-4 w-4 mr-2"
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
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="mx-auto h-12 w-12 mb-4 text-muted-foreground/40">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-medium">No milestones yet</p>
            <p className="text-sm mt-1">Add milestones to track progress on this deal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" />

          {/* Milestone Cards */}
          <div className="space-y-4">
            {sortedMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative pl-12">
                {/* Timeline Dot */}
                <div
                  className={`absolute left-0 top-4 h-8 w-8 rounded-full border-2 flex items-center justify-center ${
                    milestone.status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : isPastDue(milestone.due_date, milestone.status)
                      ? 'bg-red-100 border-red-500 text-red-500 dark:bg-red-900/30'
                      : 'bg-background border-border'
                  }`}
                >
                  {milestone.status === 'completed' ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-muted" />
                  )}
                </div>

                {/* Milestone Card */}
                <Card
                  className={`transition-all ${
                    milestone.status === 'completed' ? 'opacity-75' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`milestone-${milestone.id}`}
                        checked={milestone.status === 'completed'}
                        onCheckedChange={() =>
                          handleToggleComplete(milestone.id, milestone.status)
                        }
                        disabled={toggleMilestone.isPending}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={`milestone-${milestone.id}`}
                          className={`block font-medium cursor-pointer ${
                            milestone.status === 'completed'
                              ? 'line-through text-muted-foreground'
                              : ''
                          }`}
                        >
                          {milestone.name}
                        </label>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {milestone.due_date && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                                />
                              </svg>
                              <span
                                className={
                                  isPastDue(milestone.due_date, milestone.status)
                                    ? 'text-destructive font-medium'
                                    : ''
                                }
                              >
                                Due {formatDate(milestone.due_date)}
                              </span>
                            </div>
                          )}
                          {milestone.completed_date && (
                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <svg
                                className="h-4 w-4"
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
                              <span>Completed {formatDate(milestone.completed_date)}</span>
                            </div>
                          )}
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
