/**
 * NoteList Component
 *
 * Displays a list of notes with edit and delete actions.
 * Shows importance indicators and formatted timestamps.
 *
 * @module features/clients/components/NoteEditor/NoteList
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { formatDateTime } from '../../helpers';
import type { ClientNote } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the NoteList component
 */
export interface NoteListProps {
  /** Array of notes to display */
  notes: ClientNote[];
  /** Callback when edit button is clicked */
  onEdit?: (note: ClientNote) => void;
  /** Callback when delete button is clicked */
  onDelete?: (note: ClientNote) => void;
  /** Note ID currently being deleted (shows loading state) */
  isDeleting?: string;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// ICONS (inline SVG to avoid external dependencies)
// =============================================================================

const StarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
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

const EditIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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

const StickyNoteIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
    <path d="M15 3v4a2 2 0 0 0 2 2h4" />
  </svg>
);

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Sort notes by created_at date (newest first)
 */
function sortNotesByDate(notes: ClientNote[]): ClientNote[] {
  return [...notes].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Note list with edit and delete actions
 *
 * @example
 * ```tsx
 * <NoteList
 *   notes={notes}
 *   onEdit={(note) => handleEdit(note)}
 *   onDelete={(note) => handleDelete(note)}
 *   isDeleting={deletingNoteId}
 * />
 * ```
 */
export const NoteList: React.FC<NoteListProps> = ({
  notes,
  onEdit,
  onDelete,
  isDeleting,
  className,
}) => {
  // Sort notes by date (newest first)
  const sortedNotes = sortNotesByDate(notes);

  // Empty state
  if (notes.length === 0) {
    return (
      <div className={cn('w-full rounded-lg border border-gray-200 bg-white p-8', className)}>
        <div className="flex flex-col items-center justify-center py-4">
          <StickyNoteIcon className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No notes yet</p>
          <p className="text-xs text-gray-400 mt-1">Add your first note above</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <ul className="space-y-3" role="list">
        {sortedNotes.map((note) => {
          const isCurrentlyDeleting = isDeleting === note.id;

          return (
            <li
              key={note.id}
              data-testid="note-item"
              role="article"
              data-important={note.is_important || undefined}
              className={cn(
                // Base styles
                'rounded-lg border bg-white p-4',
                'transition-all duration-200',
                // Important note styling
                note.is_important && 'border-amber-200 bg-amber-50/30',
                // Deleting state
                isCurrentlyDeleting && 'opacity-50',
                // Default border
                !note.is_important && 'border-gray-200'
              )}
            >
              {/* Header with importance and actions */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {note.is_important && (
                    <span
                      className="flex items-center gap-1 text-amber-600"
                      aria-label="Important note"
                    >
                      <StarIcon className="h-4 w-4" />
                      <span className="text-xs font-medium hidden xs:inline">Important</span>
                    </span>
                  )}
                  <time
                    dateTime={note.created_at}
                    className="text-xs text-gray-500"
                  >
                    {formatDateTime(note.created_at)}
                  </time>
                </div>

                {/* Action buttons - accessible touch targets */}
                <div className="flex items-center gap-0.5 -mr-1.5">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(note)}
                      disabled={isCurrentlyDeleting}
                      aria-label="Edit note"
                      className={cn(
                        // Accessible touch target (44px minimum)
                        'p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px]',
                        'flex items-center justify-center',
                        'text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200',
                        isCurrentlyDeleting && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <EditIcon />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(note)}
                      disabled={isCurrentlyDeleting}
                      aria-label={
                        isCurrentlyDeleting
                          ? 'Deleting note'
                          : 'Delete note'
                      }
                      className={cn(
                        // Accessible touch target (44px minimum)
                        'p-2.5 rounded-lg transition-colors min-w-[44px] min-h-[44px]',
                        'flex items-center justify-center',
                        isCurrentlyDeleting
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100'
                      )}
                    >
                      {isCurrentlyDeleting ? <SpinnerIcon /> : <TrashIcon />}
                    </button>
                  )}
                </div>
              </div>

              {/* Note content */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                {note.content}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NoteList;
