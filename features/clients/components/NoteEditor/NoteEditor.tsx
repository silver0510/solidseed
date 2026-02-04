/**
 * NoteEditor Component
 *
 * A form component for creating and editing client notes.
 * Features include importance toggle, validation, and loading states.
 *
 * @module features/clients/components/NoteEditor/NoteEditor
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import type { ClientNote, NoteFormData } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the NoteEditor component
 */
export interface NoteEditorProps {
  /** Client ID this note belongs to */
  clientId: string;
  /** Existing note for edit mode */
  note?: ClientNote;
  /** Callback when form is submitted */
  onSubmit: (data: NoteFormData) => Promise<void>;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
  /** Whether the form is currently submitting */
  isSubmitting?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const SpinnerIcon = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
      className
    )}
    role="status"
    aria-label="Loading"
  />
);

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Note editor with importance toggle
 *
 * @example
 * ```tsx
 * // Create mode
 * <NoteEditor
 *   clientId="client_123"
 *   onSubmit={async (data) => await createNote(data)}
 * />
 *
 * // Edit mode
 * <NoteEditor
 *   clientId="client_123"
 *   note={existingNote}
 *   onSubmit={async (data) => await updateNote(data)}
 *   onCancel={() => setEditing(false)}
 * />
 * ```
 */
export const NoteEditor: React.FC<NoteEditorProps> = ({
  clientId,
  note,
  onSubmit,
  onCancel,
  isSubmitting: externalIsSubmitting,
  className,
}) => {
  const [content, setContent] = useState(note?.content || '');
  const [isImportant, setIsImportant] = useState(note?.is_important || false);
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);

  const isSubmitting = externalIsSubmitting || internalIsSubmitting;
  const isEditMode = !!note;
  const trimmedContent = content.trim();
  const isValid = trimmedContent.length > 0;

  // Update state when note prop changes (for edit mode)
  useEffect(() => {
    if (note) {
      setContent(note.content);
      setIsImportant(note.is_important);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid || isSubmitting) {
      return;
    }

    const formData: NoteFormData = {
      content: trimmedContent,
      is_important: isImportant,
    };

    try {
      setInternalIsSubmitting(true);
      await onSubmit(formData);

      // Clear form after successful submission in create mode
      if (!isEditMode) {
        setContent('');
        setIsImportant(false);
      }
    } finally {
      setInternalIsSubmitting(false);
    }
  };

  const handleToggleImportance = () => {
    if (!isSubmitting) {
      setIsImportant(!isImportant);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('w-full', className)}
      data-loading={isSubmitting || undefined}
    >
      <div className="space-y-3">
        {/* Content textarea */}
        <div className="relative">
          <label htmlFor="note-content" className="sr-only">
            Note content
          </label>
          <Textarea
            id="note-content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add a note..."
            rows={4}
            aria-label="Note content"
            className="min-h-[100px] resize-y sm:min-h-[80px]"
          />
        </div>

        {/* Actions row - stack on very small screens */}
        <div className="flex flex-col gap-2 xs:flex-row xs:items-center xs:justify-between sm:flex-row sm:items-center sm:justify-between">
          {/* Importance toggle - min touch target 44px */}
          <button
            type="button"
            onClick={handleToggleImportance}
            disabled={isSubmitting}
            aria-pressed={isImportant}
            aria-label={isImportant ? 'Remove importance' : 'Mark as important'}
            className={cn(
              // Base styles with accessible touch target
              'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm',
              'min-h-touch transition-colors',
              // Active/inactive states
              isImportant
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 active:bg-amber-500/30'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80',
              // Disabled state
              isSubmitting && 'cursor-not-allowed opacity-50'
            )}
          >
            <Star fill={isImportant ? 'currentColor' : 'none'} className="h-5 w-5" />
            <span className="sm:inline">
              {isImportant ? 'Important' : 'Mark important'}
            </span>
          </button>

          {/* Submit and cancel buttons */}
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className={cn(
                  // Base styles with accessible touch target
                  'rounded-lg px-4 py-2 text-sm font-medium min-h-touch',
                  'text-muted-foreground hover:bg-muted active:bg-muted/80',
                  'transition-colors',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={cn(
                // Base styles with accessible touch target
                'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium min-h-touch',
                'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
                'transition-colors shadow-sm',
                // Disabled state
                'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none'
              )}
            >
              {isSubmitting && <SpinnerIcon className="text-primary-foreground" />}
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default NoteEditor;
