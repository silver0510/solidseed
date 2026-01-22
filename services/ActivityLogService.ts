import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ActivityLog,
  ActivityLogWithClient,
  CreateActivityLogInput,
  ListActivityLogsParams,
  PaginatedActivityLogs,
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
 * ActivityLogService handles activity logging and retrieval
 *
 * Features:
 * - Log user activities for tracking
 * - Retrieve activities for dashboard and client profile
 * - Cursor-based pagination
 */
export class ActivityLogService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Create a new activity log entry
   */
  async logActivity(data: CreateActivityLogInput, userId: string): Promise<ActivityLog> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data: activity, error } = await this.supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        activity_type: data.activity_type,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        client_id: data.client_id,
        metadata: data.metadata,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to log activity: ${error.message}`);
    }

    return activity;
  }

  /**
   * List activities with pagination and filtering
   * Used for dashboard and client profile activity feeds
   */
  async listActivities(
    params: ListActivityLogsParams,
    userId: string
  ): Promise<PaginatedActivityLogs> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const limit = Math.min(Math.max(params.limit || 10, 1), 100);

    // Build query with left join to clients for client_name
    let query = this.supabase
      .from('activity_logs')
      .select(
        `
        *,
        clients:client_id (name)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Cursor-based pagination
    if (params.cursor) {
      query = query.lt('created_at', params.cursor);
    }

    // Filter by client_id
    if (params.client_id) {
      query = query.eq('client_id', params.client_id);
    }

    // Filter by activity_type
    if (params.activity_type) {
      query = query.eq('activity_type', params.activity_type);
    }

    // Apply limit
    query = query.limit(limit);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list activities: ${error.message}`);
    }

    // Transform data to include client_name
    const activities: ActivityLogWithClient[] = (data || []).map((activity) => ({
      ...activity,
      client_name: activity.clients?.name || undefined,
      clients: undefined, // Remove the nested object
    }));

    // Calculate next cursor
    const next_cursor =
      activities.length === limit
        ? activities[activities.length - 1].created_at
        : undefined;

    return {
      data: activities,
      next_cursor,
      total_count: count || 0,
    };
  }

  /**
   * Get recent activities for the dashboard
   * Returns the latest activities across all clients
   */
  async getRecentActivities(userId: string, limit: number = 10): Promise<ActivityLogWithClient[]> {
    const result = await this.listActivities({ limit }, userId);
    return result.data;
  }

  /**
   * Get activities for a specific client
   */
  async getClientActivities(
    clientId: string,
    userId: string,
    params: Omit<ListActivityLogsParams, 'client_id'> = {}
  ): Promise<PaginatedActivityLogs> {
    return this.listActivities({ ...params, client_id: clientId }, userId);
  }

  /**
   * Delete old activities (30-day retention)
   * Should be called by a scheduled job
   */
  async cleanupOldActivities(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await this.supabase
      .from('activity_logs')
      .delete()
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup activities: ${error.message}`);
    }

    return data?.length || 0;
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR LOGGING ACTIVITIES
// =============================================================================

/**
 * Helper function to create activity log service instance
 * and log an activity in a fire-and-forget manner
 */
export async function logActivityAsync(
  data: CreateActivityLogInput,
  userId: string
): Promise<void> {
  try {
    const service = new ActivityLogService();
    await service.logActivity(data, userId);
  } catch (error) {
    // Log error but don't throw - activity logging should not block main operations
    console.error('Failed to log activity:', error);
  }
}
