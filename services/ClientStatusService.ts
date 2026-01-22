import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ClientStatus,
  CreateClientStatusInput,
  UpdateClientStatusInput,
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
 * ClientStatusService handles all client status-related database operations
 *
 * Features:
 * - CRUD operations for user-specific client statuses
 * - Reordering of statuses
 * - Default status protection (cannot delete default statuses)
 */
export class ClientStatusService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * List all statuses for a user, ordered by position
   */
  async listStatuses(userId: string): Promise<ClientStatus[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('client_statuses')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Failed to list statuses: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single status by ID
   */
  async getStatusById(id: string, userId: string): Promise<ClientStatus | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await this.supabase
      .from('client_statuses')
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
   * Create a new client status
   */
  async createStatus(data: CreateClientStatusInput, userId: string): Promise<ClientStatus> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get the max position to place new status at the end
    const { data: maxPositionData } = await this.supabase
      .from('client_statuses')
      .select('position')
      .eq('user_id', userId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = data.position ?? ((maxPositionData?.position ?? -1) + 1);

    const { data: status, error } = await this.supabase
      .from('client_statuses')
      .insert({
        user_id: userId,
        name: data.name,
        color: data.color,
        position: nextPosition,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('A status with this name already exists');
      }
      throw new Error(error.message);
    }

    return status;
  }

  /**
   * Update an existing client status
   */
  async updateStatus(
    id: string,
    data: UpdateClientStatusInput,
    userId: string
  ): Promise<ClientStatus | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.position !== undefined) updateData.position = data.position;

    const { data: status, error } = await this.supabase
      .from('client_statuses')
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
        throw new Error('A status with this name already exists');
      }
      throw new Error(error.message);
    }

    return status;
  }

  /**
   * Delete a client status (only non-default statuses)
   */
  async deleteStatus(id: string, userId: string): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if status is default
    const status = await this.getStatusById(id, userId);
    if (!status) {
      return false;
    }

    if (status.is_default) {
      throw new Error('Cannot delete default status');
    }

    // Check if any clients are using this status
    const { count } = await this.supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('status_id', id);

    if (count && count > 0) {
      throw new Error(`Cannot delete status: ${count} client(s) are using it`);
    }

    const { error } = await this.supabase
      .from('client_statuses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .eq('is_default', false);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Reorder statuses by updating their positions
   */
  async reorderStatuses(statusIds: string[], userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Update each status position in a transaction-like manner
    const updates = statusIds.map((id, index) => ({
      id,
      position: index,
      updated_at: new Date().toISOString(),
    }));

    for (const update of updates) {
      const { error } = await this.supabase
        .from('client_statuses')
        .update({ position: update.position, updated_at: update.updated_at })
        .eq('id', update.id)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to reorder statuses: ${error.message}`);
      }
    }
  }
}
