import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  UserTag,
  CreateUserTagInput,
  UpdateUserTagInput,
} from '@/lib/types/client';

/**
 * Create Supabase admin client with service role key
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

/**
 * UserTagService handles user-defined tag templates
 *
 * Features:
 * - CRUD operations for user-specific tag templates
 * - Tags are templates that can be assigned to clients
 */
export class UserTagService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * List all tags for a user, ordered by name
   */
  async listTags(userId: string): Promise<UserTag[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('user_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to list tags: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single tag by ID
   */
  async getTagById(id: string, userId: string): Promise<UserTag | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('user_tags')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get a tag by name for a user
   */
  async getTagByName(name: string, userId: string): Promise<UserTag | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('user_tags')
      .select('*')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Create a new user tag
   */
  async createTag(data: CreateUserTagInput, userId: string): Promise<UserTag> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: tag, error } = await this.supabase
      .from('user_tags')
      .insert({
        user_id: userId,
        name: data.name,
        color: data.color,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A tag with this name already exists');
      }
      throw new Error(error.message);
    }

    return tag;
  }

  /**
   * Update an existing user tag
   */
  async updateTag(
    id: string,
    data: UpdateUserTagInput,
    userId: string
  ): Promise<UserTag | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;

    if (Object.keys(updateData).length === 0) {
      // No fields to update, return existing tag
      return this.getTagById(id, userId);
    }

    const { data: tag, error } = await this.supabase
      .from('user_tags')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      if (error.code === '23505') {
        throw new Error('A tag with this name already exists');
      }
      throw new Error(error.message);
    }

    return tag;
  }

  /**
   * Delete a user tag
   * Also removes all client_tags referencing this tag
   */
  async deleteTag(id: string, userId: string): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if tag exists
    const tag = await this.getTagById(id, userId);
    if (!tag) {
      return false;
    }

    // Delete the tag (client_tags will be deleted via ON DELETE CASCADE)
    const { error } = await this.supabase
      .from('user_tags')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Get usage count for a tag (how many clients are using it)
   */
  async getTagUsageCount(id: string, userId: string): Promise<number> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { count, error } = await this.supabase
      .from('client_tags')
      .select('*', { count: 'exact', head: true })
      .eq('tag_id', id);

    if (error) {
      throw new Error(`Failed to get tag usage: ${error.message}`);
    }

    return count || 0;
  }
}
