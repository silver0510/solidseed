/**
 * NoteService handles all client note-related database operations
 *
 * Features:
 * - Add notes to clients
 * - Update note content and importance
 * - Delete notes from clients
 * - Get all notes for a client
 *
 * Uses Supabase with service role key for server-side operations.
 * Authorization is handled in API routes via Better Auth session validation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { ClientNote, CreateNoteInput, UpdateNoteInput } from '@/lib/types/client';

/**
 * Create Supabase admin client with service role key
 * This bypasses RLS and should only be used in API routes
 */
function createSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export class NoteService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Add a note to a client
   *
   * @param clientId - The client ID to add the note to
   * @param data - Note data containing content and optional is_important flag
   * @param userId - The authenticated user ID (from Better Auth session)
   * @returns Promise<ClientNote> The created note record
   */
  async addNote(clientId: string, data: CreateNoteInput, userId: string): Promise<ClientNote> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

    // Insert note into database
    const { data: note, error } = await this.supabase
      .from('client_notes')
      .insert({
        client_id: clientId,
        content: data.content,
        is_important: data.is_important ?? false,
        created_by: userId,
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
   * @param userId - The authenticated user ID (from Better Auth session)
   * @returns Promise<ClientNote> The updated note record
   */
  async updateNote(
    clientId: string,
    noteId: string,
    data: UpdateNoteInput,
    userId: string
  ): Promise<ClientNote> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

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
   * @param userId - The authenticated user ID (from Better Auth session)
   * @returns Promise<boolean> True if deletion succeeded
   */
  async deleteNote(clientId: string, noteId: string, userId: string): Promise<boolean> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

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
   * @param clientId - The client ID to get notes for
   * @param userId - The authenticated user ID (from Better Auth session)
   * @returns Promise<ClientNote[]> Array of notes (newest first)
   */
  async getNotesByClient(clientId: string, userId: string): Promise<ClientNote[]> {
    // Verify the client belongs to this user
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('assigned_to', userId)
      .eq('is_deleted', false)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found or access denied');
    }

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
