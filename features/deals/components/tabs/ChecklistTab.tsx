/**
 * ChecklistTab Component
 *
 * Displays:
 * - Simple checklist view
 * - Completion toggle (pending → completed)
 * - Add new checklist item button
 * - Optional due dates
 * - Edit and delete functionality
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarIcon, Pencil, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDealMutations } from '../../hooks/useDealMutations';
import type { DealWithRelations, DealMilestone } from '../../types';
import { toast } from 'sonner';

export interface ChecklistTabProps {
  deal: DealWithRelations;
}

export function ChecklistTab({ deal }: ChecklistTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    due_date: undefined as Date | undefined,
  });

  const [editingItem, setEditingItem] = useState<{
    id: string;
    name: string;
    date: Date | undefined;
  } | null>(null);

  const {
    toggleMilestone,
    addMilestone,
    updateMilestone,
    deleteMilestone
  } = useDealMutations(deal.id);

  // Sort by scheduled_date (nulls last), then by created_at
  const sortedMilestones = [...(deal.milestones || [])].sort((a, b) => {
    if (!a.scheduled_date && !b.scheduled_date) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    if (!a.scheduled_date) return 1;
    if (!b.scheduled_date) return -1;
    const dateCompare = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  const handleToggleComplete = (milestone: DealMilestone) => {
    const newStatus = milestone.status === 'completed';
    toggleMilestone.mutate({
      milestoneId: milestone.id,
      completed: !newStatus,
    });
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      toast.error('Please enter a checklist item name');
      return;
    }

    addMilestone.mutate(
      {
        name: newItem.name.trim(),
        due_date: newItem.due_date ? format(newItem.due_date, 'yyyy-MM-dd') : undefined,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          setNewItem({ name: '', due_date: undefined });
          toast.success('Checklist item added');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to add checklist item');
        },
      }
    );
  };

  const handleEditItem = () => {
    if (!editingItem) return;

    if (!editingItem.name.trim()) {
      toast.error('Please enter a checklist item name');
      return;
    }

    updateMilestone.mutate(
      {
        milestoneId: editingItem.id,
        milestone_name: editingItem.name.trim(),
        scheduled_date: editingItem.date ? format(editingItem.date, 'yyyy-MM-dd') : null,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setEditingItem(null);
          toast.success('Checklist item updated');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to update checklist item');
        },
      }
    );
  };

  const handleDeleteItem = () => {
    if (!deletingMilestoneId) return;

    deleteMilestone.mutate(deletingMilestoneId, {
      onSuccess: () => {
        setDeletingMilestoneId(null);
        toast.success('Checklist item deleted');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete checklist item');
      },
    });
  };

  const openEditDialog = (milestone: DealMilestone) => {
    setEditingItem({
      id: milestone.id,
      name: milestone.milestone_name,
      date: milestone.scheduled_date ? new Date(milestone.scheduled_date) : undefined,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {/* Checklist Items */}
      {sortedMilestones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No checklist items yet.</p>
            <p className="text-sm mt-1">Click "Add Item" to create your first item.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sortedMilestones.map((milestone) => (
            <Card
              key={milestone.id}
              className={cn(
                'transition-all hover:shadow-md',
                milestone.status === 'completed' && 'opacity-60'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={milestone.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(milestone)}
                    className="mt-1"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p
                          className={cn(
                            'font-medium',
                            milestone.status === 'completed' && 'line-through text-muted-foreground'
                          )}
                        >
                          {milestone.milestone_name}
                        </p>
                        {milestone.scheduled_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <CalendarIcon className="inline h-3 w-3 mr-1" />
                            {format(new Date(milestone.scheduled_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(milestone)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingMilestoneId(milestone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
            <DialogDescription>
              Add a new item to track for this deal. Due date is optional.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., Schedule property inspection"
                autoFocus
              />
            </div>

            <div>
              <Label htmlFor="due-date">Due Date (Optional)</Label>
              <DatePicker
                value={newItem.due_date}
                onChange={(date) => setNewItem({ ...newItem, due_date: date ? new Date(date) : undefined })}
                placeholder="Pick a date"
                fromYear={2020}
                toYear={2100}
              />
              {newItem.due_date && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => setNewItem({ ...newItem, due_date: undefined })}
                >
                  Clear due date
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={addMilestone.isPending}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Checklist Item</DialogTitle>
            <DialogDescription>
              Update the checklist item details.
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Item Name *</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="e.g., Schedule property inspection"
                />
              </div>

              <div>
                <Label htmlFor="edit-date">Due Date (Optional)</Label>
                <DatePicker
                  value={editingItem.date}
                  onChange={(date) => setEditingItem({ ...editingItem, date: date ? new Date(date) : undefined })}
                  placeholder="Pick a date"
                  fromYear={2020}
                  toYear={2100}
                />
                {editingItem.date && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setEditingItem({ ...editingItem, date: undefined })}
                  >
                    Clear due date
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={updateMilestone.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMilestoneId} onOpenChange={() => setDeletingMilestoneId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Checklist Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The checklist item will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
