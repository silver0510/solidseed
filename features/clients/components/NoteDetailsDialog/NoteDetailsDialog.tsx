'use client';

/**
 * Note Details Dialog Component
 *
 * Displays note information in a popup dialog with the ability to edit.
 * Shows note content, importance status, and timestamps.
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StarIcon, PencilIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientNote, NoteFormData } from '../../types';

// =============================================================================
// SCHEMA
// =============================================================================

const noteEditSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(5000, 'Note content must be 5000 characters or less'),
  is_important: z.boolean(),
});

type NoteEditFormData = z.infer<typeof noteEditSchema>;

// =============================================================================
// TYPES
// =============================================================================

export interface NoteDetailsDialogProps {
  /** The note to display */
  note: ClientNote | null;
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Callback when note is updated or created */
  onUpdate?: (note: ClientNote | null, data: NoteFormData) => Promise<void>;
  /** Whether an update is in progress */
  isUpdating?: boolean;
  /** Whether to start in edit mode (or create mode if note is null) */
  initialEditMode?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const NoteDetailsDialog: React.FC<NoteDetailsDialogProps> = ({
  note,
  open,
  onOpenChange,
  onUpdate,
  isUpdating = false,
  initialEditMode = false,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const hasInitialized = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<NoteEditFormData>({
    resolver: zodResolver(noteEditSchema),
  });

  const isImportant = watch('is_important');

  // Handle initial edit mode when dialog opens
  useEffect(() => {
    if (open) {
      if (initialEditMode && !hasInitialized.current) {
        // Set edit mode on first open
        if (note) {
          // Editing existing note
          reset({
            content: note.content,
            is_important: note.is_important,
          });
        } else {
          // Creating new note
          reset({
            content: '',
            is_important: false,
          });
        }
        setIsEditing(true);
        hasInitialized.current = true;
      }
    } else if (!open) {
      // Reset when dialog closes
      setIsEditing(false);
      hasInitialized.current = false;
    }
  }, [open, note, initialEditMode, reset]);

  // Reset form and edit state when note changes or dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsEditing(false);
      reset();
    }
    onOpenChange(newOpen);
  };

  // Start editing mode
  const handleStartEdit = () => {
    if (note) {
      reset({
        content: note.content,
        is_important: note.is_important,
      });
      setIsEditing(true);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (isCreateMode) {
      // If creating new note, close the dialog
      handleOpenChange(false);
    } else {
      // If editing existing note, just exit edit mode
      setIsEditing(false);
      reset();
    }
  };

  // Submit edit form
  const handleFormSubmit = async (data: NoteEditFormData) => {
    if (!onUpdate) return;

    const updateData: NoteFormData = {
      content: data.content,
      is_important: data.is_important,
    };

    await onUpdate(note, updateData);
    setIsEditing(false);
  };

  // Toggle importance
  const handleToggleImportance = () => {
    setValue('is_important', !isImportant);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isCreateMode = !note;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isCreateMode ? 'Add Note' : isEditing ? 'Edit Note' : 'Note Details'}
          </DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Create a new note for this client'
              : isEditing
                ? 'Update the note information below'
                : 'View note information'}
          </DialogDescription>
        </DialogHeader>

        {isEditing || isCreateMode ? (
          // Edit Mode
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                {...register('content')}
                placeholder="Enter note content"
                rows={5}
                className="resize-y"
              />
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
            </div>

            {/* Importance Toggle */}
            <div className="space-y-2">
              <Label>Importance</Label>
              <button
                type="button"
                onClick={handleToggleImportance}
                disabled={isUpdating}
                aria-pressed={isImportant}
                aria-label={isImportant ? 'Remove importance' : 'Mark as important'}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  'min-h-11 w-full justify-center',
                  isImportant
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground border',
                  isUpdating && 'cursor-not-allowed opacity-50'
                )}
              >
                <StarIcon
                  className={cn('h-5 w-5', isImportant && 'fill-current')}
                />
                <span>{isImportant ? 'Important' : 'Mark as important'}</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : isCreateMode ? 'Add Note' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          // View Mode (only shown when not in create mode and not editing)
          note && (
            <div className="space-y-4">
              {/* Content */}
              <div className="text-sm whitespace-pre-wrap">{note.content}</div>

              {/* Importance Badge */}
              {note.is_important && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <StarIcon className="h-3.5 w-3.5 fill-current" />
                  Important
                </div>
              )}

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <div>Created: {formatDate(note.created_at)}</div>
                {note.updated_at && note.updated_at !== note.created_at && (
                  <div>Updated: {formatDate(note.updated_at)}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Close
                </Button>
                {onUpdate && (
                  <Button onClick={handleStartEdit}>
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NoteDetailsDialog;
