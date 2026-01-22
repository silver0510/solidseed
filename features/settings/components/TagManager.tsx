'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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
import type { UserTag } from '@/lib/types/client';
import {
  fetchUserTags,
  createUserTag,
  updateUserTag,
  deleteUserTag,
} from '../api/clientSettingsApi';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function TagManager() {
  const [tags, setTags] = React.useState<UserTag[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [editingTag, setEditingTag] = React.useState<UserTag | null>(null);
  const [deletingTag, setDeletingTag] = React.useState<UserTag | null>(null);
  const [formData, setFormData] = React.useState({ name: '', color: 'blue' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load tags on mount
  React.useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await fetchUserTags();
      setTags(data);
    } catch (error) {
      toast.error('Failed to load tags');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTag(null);
    setFormData({ name: '', color: 'blue' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (tag: UserTag) => {
    setEditingTag(tag);
    setFormData({ name: tag.name, color: tag.color });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (tag: UserTag) => {
    setDeletingTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTag) {
        const updated = await updateUserTag(editingTag.id, formData);
        setTags((prev) => prev.map((t) => (t.id === editingTag.id ? updated : t)));
        toast.success('Tag updated');
      } else {
        const created = await createUserTag(formData);
        setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        toast.success('Tag created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) return;

    setIsSubmitting(true);
    try {
      await deleteUserTag(deletingTag.id);
      setTags((prev) => prev.filter((t) => t.id !== deletingTag.id));
      toast.success('Tag deleted');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tag');
    } finally {
      setIsSubmitting(false);
      setDeletingTag(null);
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
          <h3 className="text-lg font-medium">Tag Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage tags to organize your clients
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Tag
        </Button>
      </div>

      {/* Tag Grid */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="group flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-sm font-medium',
                getColorBadgeClasses(tag.color)
              )}
            >
              {tag.name}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleOpenEdit(tag)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => handleOpenDelete(tag)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No tags found. Create your first tag to get started.
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
            <DialogDescription>
              {editingTag
                ? 'Update the tag name and color'
                : 'Add a new tag to organize your clients'}
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
                  placeholder="e.g., VIP"
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
                    {formData.name || 'Tag Name'}
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
                {editingTag ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingTag?.name}&quot;? This will
              remove the tag from all clients. This action cannot be undone.
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
