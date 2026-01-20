/**
 * NotesTab Component
 *
 * Displays note editor and list for a client.
 *
 * @module features/clients/components/ClientProfile/NotesTab
 */

import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { NoteEditor } from '../NoteEditor';
import { NoteList } from '../NoteEditor/NoteList';
import { noteApi } from '../../api/clientApi';
import type { ClientNote, NoteFormData } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props for the NotesTab component
 */
export interface NotesTabProps {
  /** Client ID */
  clientId: string;
  /** Array of notes to display */
  notes: ClientNote[];
  /** Callback when a note is created or modified */
  onNoteChanged?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Client notes tab with editor and list
 *
 * @example
 * ```tsx
 * <NotesTab
 *   clientId="cl123"
 *   notes={notes}
 *   onNoteChanged={refetchNotes}
 * />
 * ```
 */
export const NotesTab: React.FC<NotesTabProps> = ({
  clientId,
  notes,
  onNoteChanged,
  className,
}) => {
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Handle note submission (create or update)
  const handleSubmit = useCallback(
    async (data: NoteFormData) => {
      setIsSubmitting(true);
      try {
        if (editingNote) {
          // Update existing note
          await noteApi.updateNote(clientId, editingNote.id, data);
          setEditingNote(null);
        } else {
          // Create new note
          await noteApi.createNote(clientId, data);
          setShowNoteForm(false);
        }
        onNoteChanged?.();
      } catch (error) {
        console.error('Failed to save note:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clientId, editingNote, onNoteChanged]
  );

  // Handle edit button click
  const handleEdit = useCallback((note: ClientNote) => {
    setEditingNote(note);
    setShowNoteForm(true);
  }, []);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingNote(null);
    setShowNoteForm(false);
  }, []);

  // Handle note deletion
  const handleDelete = useCallback(
    async (note: ClientNote) => {
      setDeletingNoteId(note.id);
      try {
        await noteApi.deleteNote(clientId, note.id);
        onNoteChanged?.();
      } catch (error) {
        console.error('Failed to delete note:', error);
      } finally {
        setDeletingNoteId(null);
      }
    },
    [clientId, onNoteChanged]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Note Button */}
      {!showNoteForm && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowNoteForm(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span>Add Note</span>
          </button>
        </div>
      )}

      {/* Note Editor */}
      {showNoteForm && (
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            {editingNote ? 'Edit Note' : 'Add New Note'}
          </h3>
          <NoteEditor
            clientId={clientId}
            note={editingNote ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Notes List */}
      <NoteList
        notes={notes}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isDeleting={deletingNoteId ?? undefined}
      />
    </div>
  );
};

export default NotesTab;
