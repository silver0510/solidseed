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
  }, []);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingNote(null);
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
    <div className={cn('space-y-6', className)}>
      {/* Note Editor */}
      <NoteEditor
        clientId={clientId}
        note={editingNote ?? undefined}
        onSubmit={handleSubmit}
        onCancel={editingNote ? handleCancelEdit : undefined}
        isSubmitting={isSubmitting}
      />

      {/* Notes List */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          {notes.length > 0 ? `Notes (${notes.length})` : 'Notes'}
        </h3>
        <NoteList
          notes={notes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deletingNoteId ?? undefined}
        />
      </div>
    </div>
  );
};

export default NotesTab;
