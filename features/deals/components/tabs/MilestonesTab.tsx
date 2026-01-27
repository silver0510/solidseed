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

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDealMutations } from '../../hooks/useDealMutations';
import type { DealWithRelations, DealMilestone } from '../../types';
import {
  MILESTONE_TYPES,
  getMilestoneTypeConfig,
  hasDuplicateMilestoneType,
  type MilestoneType,
} from '../../constants/milestones';

export interface MilestonesTabProps {
  deal: DealWithRelations;
}

export function MilestonesTab({ deal }: MilestonesTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);

  const [newMilestone, setNewMilestone] = useState({
    type: 'custom' as MilestoneType,
    name: '',
    due_date: undefined as Date | undefined,
  });

  const [editingMilestone, setEditingMilestone] = useState<{
    id: string;
    name: string;
    date: Date | undefined;
    type: string;
  } | null>(null);

  const {
    toggleMilestone,
    addMilestone,
    updateMilestone,
    deleteMilestone
  } = useDealMutations(deal.id);

  // Auto-fill name when type changes
  useEffect(() => {
    const typeConfig = getMilestoneTypeConfig(newMilestone.type);
    if (typeConfig.autoName && newMilestone.type !== 'custom') {
      setNewMilestone(prev => ({
        ...prev,
        name: typeConfig.autoName,
      }));
    }
  }, [newMilestone.type]);

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
      due_date: newMilestone.due_date ? format(newMilestone.due_date, 'yyyy-MM-dd') : undefined,
      milestone_type: newMilestone.type,
    });

    setNewMilestone({ type: 'custom', name: '', due_date: undefined });
    setIsAddDialogOpen(false);
  };

  const handleEditMilestone = async () => {
    if (!editingMilestone || !editingMilestone.name) return;

    await updateMilestone.mutateAsync({
      milestoneId: editingMilestone.id,
      milestone_name: editingMilestone.name,
      scheduled_date: editingMilestone.date ? format(editingMilestone.date, 'yyyy-MM-dd') : null,
    });

    setEditingMilestone(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteMilestone = async () => {
    if (!deletingMilestoneId) return;

    await deleteMilestone.mutateAsync(deletingMilestoneId);

    setDeletingMilestoneId(null);
  };

  const openEditDialog = (milestone: DealMilestone) => {
    setEditingMilestone({
      id: milestone.id,
      name: milestone.milestone_name,
      date: milestone.scheduled_date ? new Date(milestone.scheduled_date) : undefined,
      type: milestone.milestone_type || 'custom',
    });
    setIsEditDialogOpen(true);
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
                      : milestone.status === 'cancelled'
                      ? 'bg-orange-100 border-orange-500 text-orange-500 dark:bg-orange-900/30'
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
                  ) : milestone.status === 'cancelled' ? (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted" />
                  )}
                </div>

                {/* Milestone Card */}
                <Card
                  className={`group transition-all hover:shadow-md ${
                    milestone.status === 'completed' || milestone.status === 'cancelled' ? 'opacity-75' : ''
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
                        disabled={toggleMilestone.isPending || milestone.status === 'cancelled'}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <label
                              htmlFor={`milestone-${milestone.id}`}
                              className={`text-sm font-medium ${
                                milestone.status === 'cancelled'
                                  ? 'text-muted-foreground cursor-not-allowed'
                                  : 'cursor-pointer'
                              } truncate ${
                                milestone.status === 'completed'
                                  ? 'line-through text-muted-foreground'
                                  : milestone.status === 'cancelled'
                                  ? 'line-through'
                                  : ''
                              }`}
                            >
                              {milestone.milestone_name}
                            </label>
                            {milestone.milestone_type && milestone.milestone_type !== 'custom' && (
                              <Badge
                                variant={getMilestoneTypeConfig(milestone.milestone_type).badgeVariant}
                                className="text-xs"
                              >
                                {getMilestoneTypeConfig(milestone.milestone_type).icon}{' '}
                                {getMilestoneTypeConfig(milestone.milestone_type).label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                            {milestone.scheduled_date && milestone.status !== 'cancelled' && (
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
                            {milestone.status === 'cancelled' && (
                              <span className="text-orange-600 dark:text-orange-400">
                                Cancelled
                              </span>
                            )}
                            {/* Hover Actions */}
                            {milestone.status !== 'cancelled' && (
                              <div className="hidden group-hover:flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => openEditDialog(milestone)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeletingMilestoneId(milestone.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
              <Label htmlFor="milestone-type">Milestone Type</Label>
              <Select
                value={newMilestone.type}
                onValueChange={(value) =>
                  setNewMilestone((prev) => ({ ...prev, type: value as MilestoneType }))
                }
              >
                <SelectTrigger id="milestone-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MILESTONE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {newMilestone.type !== 'custom' &&
              hasDuplicateMilestoneType(newMilestone.type, deal.milestones || []) && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    A milestone of this type already exists. You can still add another one if needed.
                  </AlertDescription>
                </Alert>
              )}
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="milestone-due-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !newMilestone.due_date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newMilestone.due_date ? (
                      format(newMilestone.due_date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newMilestone.due_date}
                    onSelect={(date) =>
                      setNewMilestone((prev) => ({ ...prev, due_date: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

      {/* Edit Milestone Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>
              Update milestone name or due date.
            </DialogDescription>
          </DialogHeader>
          {editingMilestone && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-milestone-name">
                  Milestone Name
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="edit-milestone-name"
                  value={editingMilestone.name}
                  onChange={(e) =>
                    setEditingMilestone((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="e.g., Inspection completed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-milestone-due-date">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-milestone-due-date"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !editingMilestone.date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingMilestone.date ? (
                        format(editingMilestone.date, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editingMilestone.date}
                      onSelect={(date) =>
                        setEditingMilestone((prev) =>
                          prev ? { ...prev, date } : null
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateMilestone.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditMilestone}
              disabled={!editingMilestone?.name || updateMilestone.isPending}
            >
              {updateMilestone.isPending ? 'Updating...' : 'Update Milestone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMilestoneId} onOpenChange={(open) => !open && setDeletingMilestoneId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMilestone.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMilestone}
              disabled={deleteMilestone.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMilestone.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
