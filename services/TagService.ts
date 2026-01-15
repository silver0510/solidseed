/**
 * TagService handles all client tag-related database operations
 *
 * Features:
 * - Add tags to clients
 * - Remove tags from clients
 * - Tag autocomplete for suggestions
 * - Duplicate tag prevention
 *
 * Uses Supabase for data persistence with Row Level Security (RLS) policies
 * ensuring users can only access tags for their own clients.
 */

import { createClient } from '@supabase/supabase-js';
import type { ClientTag, CreateTagInput } from '@/lib/types/client';

// Initialize Supabase client at module level
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class TagService {
  private supabase = supabase;

  /**
   * Initialize TagService
   *
   * @throws {Error} If Supabase credentials are not configured
   */
  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials not configured. Please check your environment variables.');
    }
  }

  /**
   * Add a tag to a client
   *
   * @param clientId - The client ID to add the tag to
   * @param data - Tag data containing tag_name
   * @returns Promise<ClientTag> The created tag record
   * @throws {Error} If user is not authenticated
   * @throws {Error} If tag already exists on client (duplicate)
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const tag = await tagService.addTag('client_123', { tag_name: 'VIP' });
   * ```
   */
  async addTag(clientId: string, data: CreateTagInput): Promise<ClientTag> {
    // Get authenticated user from Supabase auth
    const { data: userData, error: authError } = await this.supabase.auth.getUser();

    if (authError || !userData.user) {
      throw new Error('Not authenticated');
    }

    // Insert tag into database
    const { data: tag, error } = await this.supabase
      .from('client_tags')
      .insert({
        client_id: clientId,
        tag_name: data.tag_name,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate tag)
      if (error.code === '23505') {
        throw new Error('Tag already exists on this client');
      }
      throw new Error(error.message);
    }

    return tag;
  }

  /**
   * Remove a tag from a client
   *
   * @param clientId - The client ID the tag belongs to
   * @param tagId - The tag ID to remove
   * @returns Promise<boolean> True if deletion succeeded
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * await tagService.removeTag('client_123', 'tag_456');
   * ```
   */
  async removeTag(clientId: string, tagId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('client_tags')
      .delete()
      .eq('id', tagId)
      .eq('client_id', clientId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Get tag suggestions for autocomplete
   *
   * Returns unique tag names that match the search query.
   * Limited to 10 results for performance.
   *
   * @param query - Search query to filter tags (case-insensitive)
   * @returns Promise<string[]> Array of unique tag names
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const suggestions = await tagService.getTagAutocomplete('VIP');
   * // Returns: ['VIP', 'VIP Client', ...]
   * ```
   */
  async getTagAutocomplete(query: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('client_tags')
      .select('tag_name')
      .ilike('tag_name', `%${query}%`)
      .limit(10);

    if (error) {
      throw new Error('Failed to get tags: ' + error.message);
    }

    // Extract unique tag names
    const tagNames = data?.map((t) => t.tag_name) || [];
    return [...new Set(tagNames)];
  }
}
