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
      <div className={cn('w-full rounded-lg border border-border bg-card p-8', className)}>
        <div className="flex flex-col items-center justify-center py-4">
          <StickyNoteIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-sm text-muted-foreground">No notes yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Add your first note above</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Note
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedNotes.map((note) => {
              const isCurrentlyDeleting = isDeleting === note.id;

              return (
                <tr
                  key={note.id}
                  data-testid="note-item"
                  role="article"
                  data-important={note.is_important || undefined}
                  className={cn(
                    'transition-opacity duration-200 hover:bg-muted/30',
                    isCurrentlyDeleting && 'opacity-50'
                  )}
                >
                  {/* Content */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {note.is_important && (
                        <StarIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm text-foreground whitespace-pre-wrap wrap-break-word line-clamp-2">
                        {note.content}
                      </p>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <time
                      dateTime={note.created_at}
                      className="text-sm text-muted-foreground whitespace-nowrap"
                    >
                      {formatDateTime(note.created_at)}
                    </time>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(note)}
                          disabled={isCurrentlyDeleting}
                          aria-label="Edit note"
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            'text-muted-foreground hover:text-foreground hover:bg-muted',
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
                          aria-label={isCurrentlyDeleting ? 'Deleting note' : 'Delete note'}
                          className={cn(
                            'p-1.5 rounded transition-colors',
                            isCurrentlyDeleting
                              ? 'text-muted-foreground cursor-not-allowed'
                              : 'text-destructive/70 hover:text-destructive hover:bg-destructive/10'
                          )}
                        >
                          {isCurrentlyDeleting ? <SpinnerIcon /> : <TrashIcon />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NoteList;
