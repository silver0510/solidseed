/**
 * NotesTab Component
 *
 * Displays note editor and list for a client.
 *
 * @module features/clients/components/ClientProfile/NotesTab
 */

import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Plus } from 'lucide-react';
import { NoteList } from '../NoteEditor/NoteList';
import { NoteDetailsDialog } from '../NoteDetailsDialog';
import { noteApi } from '../../api/clientApi';
import type { ClientNote, NoteFormData } from '../../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [selectedNote, setSelectedNote] = useState<ClientNote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<ClientNote | null>(null);

  // Handle opening dialog for new note
  const handleAddNote = useCallback(() => {
    setSelectedNote(null);
    setIsEditMode(true);
    setIsDialogOpen(true);
  }, []);

  // Handle opening dialog to view note (click on row)
  const handleViewNote = useCallback((note: ClientNote) => {
    setSelectedNote(note);
    setIsEditMode(false);
    setIsDialogOpen(true);
  }, []);

  // Handle opening dialog to edit note (click on edit button)
  const handleEditNote = useCallback((note: ClientNote) => {
    setSelectedNote(note);
    setIsEditMode(true);
    setIsDialogOpen(true);
  }, []);

  // Handle note update or creation
  const handleUpdate = useCallback(
    async (note: ClientNote | null, data: NoteFormData) => {
      setIsUpdating(true);
      try {
        if (note?.id) {
          // Update existing note
          await noteApi.updateNote(clientId, note.id, data);
        } else {
          // Create new note
          await noteApi.createNote(clientId, data);
        }
        onNoteChanged?.();
        setIsDialogOpen(false);
        setSelectedNote(null);
      } catch (error) {
        console.error('Failed to save note:', error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [clientId, onNoteChanged]
  );

  // Handle note deletion - open confirm dialog
  const handleDelete = useCallback((note: ClientNote) => {
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  }, []);

  // Confirm and execute delete
  const handleConfirmDelete = useCallback(async () => {
    if (!noteToDelete) return;

    setDeletingNoteId(noteToDelete.id);
    try {
      await noteApi.deleteNote(clientId, noteToDelete.id);
      onNoteChanged?.();
      setIsDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setDeletingNoteId(null);
    }
  }, [noteToDelete, clientId, onNoteChanged]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setNoteToDelete(null);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add Note Button */}
      <div className="flex justify-end">
        <button
          onClick={handleAddNote}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Notes List */}
      <NoteList
        notes={notes}
        onView={handleViewNote}
        onEdit={handleEditNote}
        onDelete={handleDelete}
        isDeleting={deletingNoteId ?? undefined}
      />

      {/* Note Details Dialog */}
      <NoteDetailsDialog
        note={selectedNote}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUpdate={handleUpdate}
        isUpdating={isUpdating}
        initialEditMode={isEditMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {noteToDelete && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">
                  {noteToDelete.content}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deletingNoteId === noteToDelete?.id}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingNoteId === noteToDelete?.id}
              >
                {deletingNoteId === noteToDelete?.id ? 'Deleting...' : 'Delete Note'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotesTab;
