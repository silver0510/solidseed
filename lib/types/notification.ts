/**
 * Notification Type Definitions
 *
 * Core types for the notification system.
 * These align with the database schema.
 */

// Notification categories (extensible)
export type NotificationCategory = 'task' | 'deal' | 'client' | 'system' | 'general';

// Task notification types
export type TaskNotificationType =
  | 'task.assigned'
  | 'task.completed'
  | 'task.due_soon'
  | 'task.overdue';

// Future: Deal notification types
export type DealNotificationType =
  | 'deal.stage_changed'
  | 'deal.won'
  | 'deal.lost';

// Future: System notification types
export type SystemNotificationType =
  | 'system.trial_expiring'
  | 'system.subscription_renewed';

// All notification types (extensible union)
export type NotificationType =
  | TaskNotificationType
  | DealNotificationType
  | SystemNotificationType;

// Entity types for polymorphic references
export type NotificationEntityType = 'task' | 'deal' | 'client';

/**
 * Base notification record (from database)
 */
export interface Notification {
  id: string;
  user_id: string;

  // Type and category
  type: NotificationType;
  category: NotificationCategory;

  // Content
  title: string;
  message: string | null;

  // Entity reference
  entity_type: NotificationEntityType | null;
  entity_id: string | null;

  // Metadata (type-specific)
  metadata: Record<string, unknown>;

  // State
  read_at: string | null;
  dismissed_at: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a notification
 */
export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string | null;
  entity_type?: NotificationEntityType | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Notification with computed fields for UI
 */
export interface NotificationWithComputed extends Notification {
  /** Human-readable time ago (e.g., "5 min ago") */
  time_ago: string;
  /** Action URL (computed from metadata) */
  action_url?: string;
}

/**
 * Filters for listing notifications
 */
export interface NotificationFilters {
  category?: NotificationCategory;
  read?: boolean; // true = read only, false = unread only, undefined = all
  limit?: number;
  cursor?: string; // created_at for pagination
  [key: string]: unknown; // Allow index signature for buildQueryString compatibility
}

/**
 * Paginated notification response
 */
export interface PaginatedNotifications {
  data: Notification[];
  next_cursor: string | null;
  total_count: number;
  unread_count: number;
}
