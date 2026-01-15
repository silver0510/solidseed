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
// ICONS (inline SVG to avoid external dependencies)
// =============================================================================

const StarIcon = ({ className, filled }: { className?: string; filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

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
          <textarea
            id="note-content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            placeholder="Add a note..."
            rows={4}
            aria-label="Note content"
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400',
              'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              'resize-none'
            )}
          />
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2">
          {/* Importance toggle */}
          <button
            type="button"
            onClick={handleToggleImportance}
            disabled={isSubmitting}
            aria-pressed={isImportant}
            aria-label={isImportant ? 'Remove importance' : 'Mark as important'}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors',
              isImportant
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
              isSubmitting && 'cursor-not-allowed opacity-50'
            )}
          >
            <StarIcon filled={isImportant} className="h-4 w-4" />
            <span className="hidden sm:inline">
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
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  'text-gray-600 hover:bg-gray-100',
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
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
                'bg-blue-600 text-white hover:bg-blue-700',
                'transition-colors',
                'disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500'
              )}
            >
              {isSubmitting && <SpinnerIcon className="text-white" />}
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default NoteEditor;
