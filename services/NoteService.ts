/**
 * NoteService handles all client note-related database operations
 *
 * Features:
 * - Add notes to clients
 * - Update note content and importance
 * - Delete notes from clients
 * - Get all notes for a client
 *
 * Uses Supabase for data persistence with Row Level Security (RLS) policies
 * ensuring users can only access notes for their own clients.
 */

import { createClient } from '@supabase/supabase-js';
import type { ClientNote, CreateNoteInput, UpdateNoteInput } from '@/lib/types/client';

// Initialize Supabase client at module level
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class NoteService {
  private supabase = supabase;

  /**
   * Initialize NoteService
   *
   * @throws {Error} If Supabase credentials are not configured
   */
  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials not configured. Please check your environment variables.');
    }
  }

  /**
   * Add a note to a client
   *
   * @param clientId - The client ID to add the note to
   * @param data - Note data containing content and optional is_important flag
   * @returns Promise<ClientNote> The created note record
   * @throws {Error} If user is not authenticated
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const note = await noteService.addNote('client_123', {
   *   content: 'Called about property viewing',
   *   is_important: false
   * });
   * ```
   */
  async addNote(clientId: string, data: CreateNoteInput): Promise<ClientNote> {
    // Get authenticated user from Supabase auth
    const { data: userData, error: authError } = await this.supabase.auth.getUser();

    if (authError || !userData.user) {
      throw new Error('Not authenticated');
    }

    // Insert note into database
    const { data: note, error } = await this.supabase
      .from('client_notes')
      .insert({
        client_id: clientId,
        content: data.content,
        is_important: data.is_important ?? false,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return note;
  }

  /**
   * Update an existing note
   *
   * @param clientId - The client ID the note belongs to
   * @param noteId - The note ID to update
   * @param data - Updated note data
   * @returns Promise<ClientNote> The updated note record
   * @throws {Error} If note not found
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const note = await noteService.updateNote('client_123', 'note_456', {
   *   content: 'Updated content',
   *   is_important: true
   * });
   * ```
   */
  async updateNote(clientId: string, noteId: string, data: UpdateNoteInput): Promise<ClientNote> {
    const updateData: Partial<ClientNote> = {};

    if (data.content !== undefined) {
      updateData.content = data.content;
    }
    if (data.is_important !== undefined) {
      updateData.is_important = data.is_important;
    }

    const { data: note, error } = await this.supabase
      .from('client_notes')
      .update(updateData)
      .eq('id', noteId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return note;
  }

  /**
   * Delete a note from a client
   *
   * @param clientId - The client ID the note belongs to
   * @param noteId - The note ID to delete
   * @returns Promise<boolean> True if deletion succeeded
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * await noteService.deleteNote('client_123', 'note_456');
   * ```
   */
  async deleteNote(clientId: string, noteId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId)
      .eq('client_id', clientId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Get all notes for a client
   *
   * Returns notes ordered by created_at descending (newest first).
   *
   * @param clientId - The client ID to get notes for
   * @returns Promise<ClientNote[]> Array of notes
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const notes = await noteService.getNotesByClient('client_123');
   * ```
   */
  async getNotesByClient(clientId: string): Promise<ClientNote[]> {
    const { data, error } = await this.supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to get notes: ' + error.message);
    }

    return data || [];
  }
}
