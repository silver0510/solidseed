import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
  PaginatedNotifications,
} from '@/lib/types/notification';

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
 * NotificationService handles notification creation and retrieval
 *
 * Features:
 * - Create notifications for various events
 * - Lazy evaluation for due/overdue tasks
 * - Deduplication for date-based notifications
 * - Mark as read / read all
 * - Cursor-based pagination
 */
export class NotificationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data: notification, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: input.user_id,
        type: input.type,
        category: input.category,
        title: input.title,
        message: input.message || null,
        entity_type: input.entity_type || null,
        entity_id: input.entity_id || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return notification;
  }

  /**
   * List notifications with pagination and filtering
   */
  async list(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<PaginatedNotifications> {
    const limit = Math.min(Math.max(filters.limit || 20, 1), 100);

    // Build query
    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Filter by category
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Filter by read status
    if (filters.read === true) {
      query = query.not('read_at', 'is', null);
    } else if (filters.read === false) {
      query = query.is('read_at', null);
    }

    // Cursor-based pagination
    if (filters.cursor) {
      query = query.lt('created_at', filters.cursor);
    }

    // Apply limit
    query = query.limit(limit);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list notifications: ${error.message}`);
    }

    // Get unread count separately
    const { count: unreadCount, error: unreadError } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (unreadError) {
      console.error('Failed to get unread count:', unreadError);
    }

    // Calculate next cursor
    const next_cursor =
      data && data.length === limit
        ? data[data.length - 1]?.created_at
        : null;

    return {
      data: data || [],
      next_cursor,
      total_count: count || 0,
      unread_count: unreadCount || 0,
    };
  }

  /**
   * Get unread count for badge
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId) // Security: ensure user owns notification
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id');

    if (error) {
      throw new Error(`Failed to mark all as read: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Check if notification already exists (for deduplication)
   * Used by lazy evaluation to avoid duplicate due/overdue notifications
   */
  async exists(
    userId: string,
    type: string,
    entityId: string,
    withinHours: number = 24
  ): Promise<boolean> {
    const since = new Date();
    since.setHours(since.getHours() - withinHours);

    const { data, error } = await this.supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('entity_id', entityId)
      .gte('created_at', since.toISOString())
      .limit(1);

    if (error) {
      console.error('Failed to check notification existence:', error);
      return false; // Fail open - allow creation
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Lazy evaluation: Create due_soon/overdue notifications for tasks
   * Called when user fetches notifications
   */
  async evaluateTaskNotifications(userId: string): Promise<void> {
    try {
      // Query tasks assigned to user that are not closed
      const { data: tasks, error } = await this.supabase
        .from('client_tasks')
        .select('id, title, due_date, client_id, clients(name)')
        .eq('assigned_to', userId)
        .neq('status', 'closed')
        .not('due_date', 'is', null);

      if (error) {
        console.error('Failed to query tasks for lazy evaluation:', error);
        return;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      for (const task of tasks || []) {
        const dueDate = new Date(task.due_date);
        const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()); // Normalize to midnight
        const clientName = (task.clients as { name: string } | null)?.name || 'Unknown Client';

        // Check if overdue (past due date, before today)
        if (dueDateMidnight < today) {
          // Check if notification already exists
          const exists = await this.exists(userId, 'task.overdue', task.id, 24);
          if (!exists) {
            await this.create({
              user_id: userId,
              type: 'task.overdue',
              category: 'task',
              title: 'Task Overdue',
              message: `"${task.title}" for ${clientName} is overdue`,
              entity_type: 'task',
              entity_id: task.id,
              metadata: {
                task_title: task.title,
                client_name: clientName,
                client_id: task.client_id,
                due_date: task.due_date,
                action_url: `/clients/${task.client_id}?tab=tasks`,
              },
            });
          }
        }
        // Check if due soon (today or tomorrow)
        else if (dueDateMidnight >= today && dueDateMidnight < dayAfterTomorrow) {
          const exists = await this.exists(userId, 'task.due_soon', task.id, 24);
          if (!exists) {
            await this.create({
              user_id: userId,
              type: 'task.due_soon',
              category: 'task',
              title: 'Task Due Soon',
              message: `"${task.title}" for ${clientName} is due soon`,
              entity_type: 'task',
              entity_id: task.id,
              metadata: {
                task_title: task.title,
                client_name: clientName,
                client_id: task.client_id,
                due_date: task.due_date,
                action_url: `/clients/${task.client_id}?tab=tasks`,
              },
            });
          }
        }
      }
    } catch (error) {
      // Fail silently - lazy evaluation should not break notification fetching
      console.error('Error during lazy task evaluation:', error);
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Helper function to create notification in a fire-and-forget manner
 * Follows the same pattern as logActivityAsync
 */
export async function notifyAsync(
  input: CreateNotificationInput
): Promise<void> {
  try {
    const service = new NotificationService();
    await service.create(input);
  } catch (error) {
    // Log error but don't throw - notifications should not block main operations
    console.error('Failed to create notification:', error);
  }
}
