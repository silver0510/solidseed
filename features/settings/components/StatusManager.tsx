'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { PRESET_COLORS, getColorBadgeClasses } from '@/lib/constants/colors';
import type { ClientStatus } from '@/lib/types/client';
import {
  fetchClientStatuses,
  createClientStatus,
  updateClientStatus,
  deleteClientStatus,
  reorderClientStatuses,
} from '../api/clientSettingsApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function StatusManager() {
  const [statuses, setStatuses] = React.useState<ClientStatus[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingStatus, setEditingStatus] = React.useState<ClientStatus | null>(null);
  const [deletingStatus, setDeletingStatus] = React.useState<ClientStatus | null>(null);
  const [formData, setFormData] = React.useState({ name: '', color: 'blue' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  // Load statuses on mount
  React.useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const data = await fetchClientStatuses();
      setStatuses(data);
    } catch (error) {
      toast.error('Failed to load statuses');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingStatus(null);
    setFormData({ name: '', color: 'blue' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (status: ClientStatus) => {
    setEditingStatus(status);
    setFormData({ name: status.name, color: status.color });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (status: ClientStatus) => {
    setDeletingStatus(status);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Status name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStatus) {
        const updated = await updateClientStatus(editingStatus.id, formData);
        setStatuses((prev) =>
          prev.map((s) => (s.id === editingStatus.id ? updated : s))
        );
        toast.success('Status updated');
      } else {
        const created = await createClientStatus(formData);
        setStatuses((prev) => [...prev, created]);
        toast.success('Status created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStatus) return;

    setIsSubmitting(true);
    try {
      await deleteClientStatus(deletingStatus.id);
      setStatuses((prev) => prev.filter((s) => s.id !== deletingStatus.id));
      toast.success('Status deleted');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete status');
    } finally {
      setIsSubmitting(false);
      setDeletingStatus(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStatuses = [...statuses];
    const [draggedItem] = newStatuses.splice(draggedIndex, 1);
    newStatuses.splice(index, 0, draggedItem);
    setStatuses(newStatuses);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    setDraggedIndex(null);

    try {
      await reorderClientStatuses(statuses.map((s) => s.id));
    } catch (error) {
      toast.error('Failed to reorder statuses');
      loadStatuses(); // Reload to get correct order
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Status Management</h3>
          <p className="text-sm text-muted-foreground">
            Customize client statuses for your workflow
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Status
        </Button>
      </div>

      {/* Status List */}
      <div className="space-y-2">
        {statuses.map((status, index) => (
          <div
            key={status.id}
            draggable={!status.is_default}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border bg-card',
              draggedIndex === index && 'opacity-50',
              !status.is_default && 'cursor-move'
            )}
          >
            {!status.is_default && (
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            )}
            {status.is_default && <div className="w-4" />}

            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-sm font-medium',
                getColorBadgeClasses(status.color)
              )}
            >
              {status.name}
            </span>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleOpenEdit(status)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {!status.is_default && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleOpenDelete(status)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {statuses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No statuses found. Create your first status to get started.
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? 'Edit Status' : 'Create Status'}</DialogTitle>
            <DialogDescription>
              {editingStatus
                ? 'Update the status name and color'
                : 'Add a new status for your clients'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Qualified"
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, color: color.name }))
                      }
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        formData.color === color.name
                          ? 'border-foreground scale-110'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 rounded-lg border bg-muted/50">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-sm font-medium',
                      getColorBadgeClasses(formData.color)
                    )}
                  >
                    {formData.name || 'Status Name'}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingStatus ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingStatus?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
