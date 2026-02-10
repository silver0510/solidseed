# Notification Feature Implementation Plan

## Overview

Build a notification system for task-related events, extensible for future notification types (deals, clients, system alerts).

**Trigger Strategy:**
- `task.assigned` / `task.completed` → Inline in API routes (fire-and-forget)
- `task.due_soon` / `task.overdue` → Lazy evaluation on notifications fetch
- Self-action exclusion: No notifications for self-assigned or self-completed tasks

**Tech Stack:**
- Next.js 16 App Router + React Query v5
- Supabase PostgreSQL + Sonner toasts
- Follows existing patterns: `ActivityLogService`, `clientApi`, `useAllTasks`

---

## Phase 1: Database Schema

### Step 1.1: Create Migration

**File:** `supabase/migrations/YYYYMMDD_create_notifications.sql`

```sql
-- Notifications table for in-app alerts
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Extensible type system
  type TEXT NOT NULL,              -- 'task.due_soon', 'task.overdue', 'task.assigned', 'task.completed'
  category TEXT NOT NULL DEFAULT 'general', -- 'task', 'deal', 'client', 'system'

  -- Content
  title TEXT NOT NULL,
  message TEXT,

  -- Polymorphic entity reference (reuses activity_logs pattern)
  entity_type TEXT,               -- 'task', 'deal', 'client'
  entity_id UUID,

  -- Flexible metadata for future types
  metadata JSONB DEFAULT '{}',    -- { client_name, due_date, deal_stage, action_url, task_title }

  -- State
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT notifications_category_check CHECK (category IN ('task', 'deal', 'client', 'system', 'general'))
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Composite index for deduplication (used by lazy evaluation)
CREATE INDEX idx_notifications_dedup ON notifications(user_id, type, entity_id, DATE(created_at));

COMMENT ON TABLE notifications IS 'In-app notification system for task alerts, deal updates, and system messages';
COMMENT ON COLUMN notifications.type IS 'Free-form notification type for extensibility';
COMMENT ON COLUMN notifications.category IS 'Grouped category for filtering UI';
COMMENT ON COLUMN notifications.metadata IS 'Type-specific data without schema changes';
```

**Action:**
1. Run: `supabase db push` (applies to remote Supabase)
2. Verify in Supabase Dashboard → Database → Tables

### Step 1.2: Update DBML

**File:** `.claude/database/database.dbml`

Add after the `client_tasks` table definition:

```dbml
// In-app notifications for task alerts, deal updates, and system messages
Table notifications {
  id uuid [pk, default: `gen_random_uuid()`, note: 'UUID primary key (PostgreSQL native, auto-generated)']

  user_id uuid [not null, ref: > users.id, note: 'Notification recipient (CASCADE delete)']

  // Extensible type system
  type varchar(100) [not null, note: 'Notification type: task.due_soon, task.overdue, task.assigned, task.completed, deal.stage_changed, etc.']
  category varchar(50) [not null, default: 'general', note: 'Category: task, deal, client, system, general']

  // Content
  title text [not null, note: 'Notification title/heading']
  message text [note: 'Optional detailed message']

  // Polymorphic entity reference
  entity_type varchar(50) [note: 'Entity type: task, deal, client']
  entity_id uuid [note: 'Reference to entity (not enforced FK for flexibility)']

  // Flexible metadata
  metadata jsonb [default: '{}', note: 'Type-specific data: client_name, due_date, action_url, etc.']

  // State tracking
  read_at timestamptz [note: 'When notification was marked as read']
  dismissed_at timestamptz [note: 'When notification was dismissed (future use)']

  // Timestamps
  created_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamptz [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (user_id, read_at) [name: 'idx_notifications_user_unread', note: 'WHERE read_at IS NULL']
    (user_id, created_at) [name: 'idx_notifications_user_created']
    (entity_type, entity_id) [name: 'idx_notifications_entity']
    type [name: 'idx_notifications_type']
    (user_id, type, entity_id, 'DATE(created_at)') [name: 'idx_notifications_dedup', note: 'Deduplication for lazy evaluation']
  }

  note: 'In-app notifications for task alerts, deal updates, and system messages'
}
```

Add to TableGroup:

```dbml
TableGroup notifications {
  notifications
}
```

---

## Phase 2: Type Definitions

### Step 2.1: Core Notification Types

**File:** `lib/types/notification.ts`

```typescript
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
```

---

## Phase 3: Service Layer

### Step 3.1: NotificationService

**File:** `services/NotificationService.ts`

```typescript
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
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const task of tasks || []) {
        const dueDate = new Date(task.due_date);
        const clientName = task.clients?.name || 'Unknown Client';

        // Check if overdue (past due date, not today)
        if (dueDate < now && dueDate.toDateString() !== now.toDateString()) {
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
        // Check if due soon (within 24 hours)
        else if (dueDate >= now && dueDate <= tomorrow) {
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
```

---

## Phase 4: API Routes

### Step 4.1: GET /api/notifications

**File:** `app/api/notifications/route.ts`

```typescript
/**
 * API Route: /api/notifications
 *
 * Handles notification listing and retrieval.
 * Includes lazy evaluation for due/overdue tasks.
 *
 * GET - List notifications with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getSessionUser } from '@/lib/auth/session';
import type { NotificationFilters } from '@/lib/types/notification';

const notificationService = new NotificationService();

/**
 * GET /api/notifications
 *
 * List notifications for the authenticated user
 * Query params: category, read, limit, cursor
 */
export async function GET(request: NextRequest) {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const filters: NotificationFilters = {};

    if (searchParams.has('category')) {
      filters.category = searchParams.get('category') as NotificationFilters['category'];
    }

    if (searchParams.has('read')) {
      const readParam = searchParams.get('read');
      filters.read = readParam === 'true' ? true : readParam === 'false' ? false : undefined;
    }

    if (searchParams.has('limit')) {
      filters.limit = parseInt(searchParams.get('limit') || '20', 10);
    }

    if (searchParams.has('cursor')) {
      filters.cursor = searchParams.get('cursor') || undefined;
    }

    // Lazy evaluation: Check for due/overdue tasks
    // Fire-and-forget - don't wait for completion
    notificationService.evaluateTaskNotifications(user.id).catch((error) => {
      console.error('Lazy evaluation failed:', error);
    });

    // Fetch notifications
    const result = await notificationService.list(user.id, filters);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
```

### Step 4.2: GET /api/notifications/unread-count

**File:** `app/api/notifications/unread-count/route.ts`

```typescript
/**
 * API Route: /api/notifications/unread-count
 *
 * Fast endpoint for unread notification count (sidebar badge)
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getSessionUser } from '@/lib/auth/session';

const notificationService = new NotificationService();

/**
 * GET /api/notifications/unread-count
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const count = await notificationService.getUnreadCount(user.id);

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
```

### Step 4.3: PATCH /api/notifications/[id]/read

**File:** `app/api/notifications/[id]/read/route.ts`

```typescript
/**
 * API Route: /api/notifications/:id/read
 *
 * Mark a single notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getSessionUser } from '@/lib/auth/session';

const notificationService = new NotificationService();

/**
 * PATCH /api/notifications/:id/read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const notification = await notificationService.markAsRead(id, user.id);

    return NextResponse.json(notification, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
```

### Step 4.4: PATCH /api/notifications/read-all

**File:** `app/api/notifications/read-all/route.ts`

```typescript
/**
 * API Route: /api/notifications/read-all
 *
 * Mark all notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/NotificationService';
import { getSessionUser } from '@/lib/auth/session';

const notificationService = new NotificationService();

/**
 * PATCH /api/notifications/read-all
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const count = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({ count, message: `Marked ${count} notifications as read` }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
```

---

## Phase 5: Feature Module

### Step 5.1: Notification API Client

**File:** `features/notifications/api/notificationApi.ts`

```typescript
/**
 * Notification API Service Layer
 *
 * Provides a clean API interface for frontend components and React Query hooks.
 */

import type {
  Notification,
  NotificationFilters,
  PaginatedNotifications,
} from '@/lib/types/notification';
import { getBaseUrl, handleResponse, buildQueryString } from '@/lib/api/utils';

/**
 * Notification API methods
 */
export const notificationApi = {
  /**
   * List notifications with pagination and filtering
   */
  list: async (filters: NotificationFilters = {}): Promise<PaginatedNotifications> => {
    const baseUrl = getBaseUrl();
    const queryString = buildQueryString(filters);
    const response = await fetch(`${baseUrl}/api/notifications${queryString}`, {
      credentials: 'include',
    });
    return handleResponse<PaginatedNotifications>(response);
  },

  /**
   * Get unread count (for badge)
   */
  getUnreadCount: async (): Promise<number> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/notifications/unread-count`, {
      credentials: 'include',
    });
    const data = await handleResponse<{ count: number }>(response);
    return data.count;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<Notification> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
    return handleResponse<Notification>(response);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ count: number }> => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/notifications/read-all`, {
      method: 'PATCH',
      credentials: 'include',
    });
    return handleResponse<{ count: number; message: string }>(response);
  },
};

/**
 * Query key factory for React Query
 */
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (filters: NotificationFilters) => [...notificationQueryKeys.lists(), filters] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
};
```

### Step 5.2: useNotifications Hook

**File:** `features/notifications/hooks/useNotifications.ts`

```typescript
/**
 * useNotifications Hook
 *
 * Fetches and manages notifications with polling for live updates
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi, notificationQueryKeys } from '../api/notificationApi';
import type { NotificationFilters } from '@/lib/types/notification';

export interface UseNotificationsOptions {
  filters?: NotificationFilters;
  /** Enable polling for live updates (default: true) */
  polling?: boolean;
  /** Polling interval in ms (default: 60000 = 1 minute) */
  pollingInterval?: number;
}

/**
 * Hook for fetching notifications
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { filters = {}, polling = true, pollingInterval = 60000 } = options;

  const query = useQuery({
    queryKey: notificationQueryKeys.list(filters),
    queryFn: () => notificationApi.list(filters),
    refetchInterval: polling ? pollingInterval : false,
    refetchOnWindowFocus: true,
  });

  return {
    notifications: query.data?.data || [],
    unreadCount: query.data?.unread_count || 0,
    totalCount: query.data?.total_count || 0,
    nextCursor: query.data?.next_cursor || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

### Step 5.3: useUnreadCount Hook

**File:** `features/notifications/hooks/useUnreadCount.ts`

```typescript
/**
 * useUnreadCount Hook
 *
 * Lightweight hook for unread count badge (used in sidebar)
 */

import { useQuery } from '@tanstack/react-query';
import { notificationApi, notificationQueryKeys } from '../api/notificationApi';

export interface UseUnreadCountOptions {
  /** Enable polling for live updates (default: true) */
  polling?: boolean;
  /** Polling interval in ms (default: 60000 = 1 minute) */
  pollingInterval?: number;
}

/**
 * Hook for fetching unread notification count
 */
export function useUnreadCount(options: UseUnreadCountOptions = {}) {
  const { polling = true, pollingInterval = 60000 } = options;

  const query = useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: polling ? pollingInterval : false,
    refetchOnWindowFocus: true,
  });

  return {
    count: query.data || 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
```

### Step 5.4: useNotificationMutations Hook

**File:** `features/notifications/hooks/useNotificationMutations.ts`

```typescript
/**
 * useNotificationMutations Hook
 *
 * Handles mark-as-read actions with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, notificationQueryKeys } from '../api/notificationApi';
import { toast } from 'sonner';

/**
 * Hook for notification mutations (mark as read)
 */
export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      // Invalidate all notification queries to refetch
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to mark as read');
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: (data) => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.all });
      if (data.count > 0) {
        toast.success(`Marked ${data.count} notifications as read`);
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to mark all as read');
    },
  });

  return {
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    isMarkingAsRead: markAsRead.isPending,
    isMarkingAllAsRead: markAllAsRead.isPending,
  };
}
```

### Step 5.5: Types Barrel Export

**File:** `features/notifications/types/index.ts`

```typescript
/**
 * Notification types barrel export
 */

export type {
  Notification,
  NotificationCategory,
  NotificationType,
  TaskNotificationType,
  NotificationEntityType,
  CreateNotificationInput,
  NotificationWithComputed,
  NotificationFilters,
  PaginatedNotifications,
} from '@/lib/types/notification';
```

### Step 5.6: Feature Barrel Export

**File:** `features/notifications/index.ts`

```typescript
/**
 * Notifications feature barrel export
 */

export * from './api/notificationApi';
export * from './hooks/useNotifications';
export * from './hooks/useUnreadCount';
export * from './hooks/useNotificationMutations';
export * from './types';
```

---

## Phase 6: Update Sidebar

### Step 6.1: Wire NotificationsDropdown

**File:** `components/layout/Sidebar.tsx` (modify lines 220-312)

Replace the hardcoded `NotificationsDropdown` component with:

```typescript
import { useNotifications, useNotificationMutations } from '@/features/notifications';
import { formatDistanceToNow } from 'date-fns'; // Install: npm install date-fns

function NotificationsDropdown({ isCollapsed }: { isCollapsed?: boolean }) {
  // Fetch recent unread + read notifications (limit 10)
  const { notifications, unreadCount, isLoading } = useNotifications({
    filters: { limit: 10 },
    polling: true,
    pollingInterval: 60000, // Poll every 60 seconds
  });

  const { markAsRead, markAllAsRead } = useNotificationMutations();

  const router = useRouter(); // Add import: import { useRouter } from 'next/navigation';

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate to action URL if available
    const actionUrl = notification.metadata?.action_url as string | undefined;
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex w-full items-center rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
        )}>
          <span className="relative text-muted-foreground">
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          {!isCollapsed && 'Notifications'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 rounded-lg"
        align="start"
        side="right"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 font-medium">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <p className={cn(
                  "text-sm font-medium leading-tight",
                  !notification.read_at && "text-foreground"
                )}>
                  {notification.title}
                </p>
                {!notification.read_at && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
              {notification.message && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground/70">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="justify-center text-sm text-primary hover:text-primary cursor-pointer"
          onClick={() => router.push('/notifications')}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Install date-fns:**
```bash
npm install date-fns
```

---

## Phase 7: Trigger Notifications

### Step 7.1: Task Assignment Notification

**File:** `app/api/clients/[id]/tasks/route.ts` (modify POST handler)

After line 92 (`const task = await taskService.addTask(...)`), add:

```typescript
// Notify assigned user (if different from creator)
if (task.assigned_to !== user.id) {
  notifyAsync({
    user_id: task.assigned_to,
    type: 'task.assigned',
    category: 'task',
    title: 'New Task Assigned',
    message: `You have been assigned: "${task.title}"`,
    entity_type: 'task',
    entity_id: task.id,
    metadata: {
      task_title: task.title,
      client_id: clientId,
      assigned_by: user.id,
      action_url: `/clients/${clientId}?tab=tasks`,
    },
  });
}
```

Add import at top:
```typescript
import { notifyAsync } from '@/services/NotificationService';
```

### Step 7.2: Task Completion Notification

**File:** `app/api/clients/[id]/tasks/[taskId]/route.ts` (modify PATCH handler)

After line 62 (`if (validatedData.status === 'closed') {`), add:

```typescript
// Notify task creator (if different from completer)
if (task.created_by !== user.id) {
  notifyAsync({
    user_id: task.created_by,
    type: 'task.completed',
    category: 'task',
    title: 'Task Completed',
    message: `"${task.title}" has been completed`,
    entity_type: 'task',
    entity_id: task.id,
    metadata: {
      task_title: task.title,
      client_id: clientId,
      completed_by: user.id,
      action_url: `/clients/${clientId}?tab=tasks`,
    },
  });
}
```

Add import at top:
```typescript
import { notifyAsync } from '@/services/NotificationService';
```

---

## Phase 8: Notifications Page

### Step 8.1: Full Notifications Page

**File:** `app/(dashboard)/notifications/page.tsx`

```typescript
'use client';

import { useNotifications, useNotificationMutations } from '@/features/notifications';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { BellIcon, CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types/notification';

export default function NotificationsPage() {
  const router = useRouter();
  const { markAsRead, markAllAsRead } = useNotificationMutations();

  // Fetch all, unread, and read notifications
  const all = useNotifications({ filters: { limit: 50 } });
  const unread = useNotifications({ filters: { read: false, limit: 50 } });
  const read = useNotifications({ filters: { read: true, limit: 50 } });

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      markAsRead(notification.id);
    }

    // Navigate to action URL
    const actionUrl = notification.metadata?.action_url as string | undefined;
    if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const renderNotifications = (notifications: Notification[], isLoading: boolean) => {
    if (isLoading) {
      return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <BellIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No notifications</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              'p-4 cursor-pointer transition-colors hover:bg-muted/50',
              !notification.read_at && 'border-l-4 border-l-primary'
            )}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className={cn(
                    'text-sm font-medium',
                    !notification.read_at && 'text-foreground font-semibold'
                  )}>
                    {notification.title}
                  </h4>
                  {!notification.read_at && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                {notification.message && (
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground/70">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notification.read_at && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on your tasks and activities
          </p>
        </div>
        {unread.unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            All ({all.totalCount})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unread.unreadCount})
          </TabsTrigger>
          <TabsTrigger value="read">
            Read ({read.totalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderNotifications(all.notifications, all.isLoading)}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {renderNotifications(unread.notifications, unread.isLoading)}
        </TabsContent>

        <TabsContent value="read" className="mt-6">
          {renderNotifications(read.notifications, read.isLoading)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## Implementation Order Summary

1. **Phase 1: Database** — Migration + DBML update
2. **Phase 2: Types** — `lib/types/notification.ts`
3. **Phase 3: Service** — `services/NotificationService.ts`
4. **Phase 4: API Routes** — 4 route handlers
5. **Phase 5: Feature Module** — API client + 3 hooks
6. **Phase 6: Sidebar** — Wire `NotificationsDropdown` to real data
7. **Phase 7: Triggers** — Add `notifyAsync` to task API routes
8. **Phase 8: Page** — Full notifications page at `/notifications`

**Testing checklist:**
- [ ] Create task and assign to another user → notification appears
- [ ] Complete someone else's task → creator gets notified
- [ ] Self-assign task → no notification
- [ ] Self-complete task → no notification
- [ ] Task due within 24h → notification on next fetch
- [ ] Task overdue → notification on next fetch
- [ ] Mark as read → badge count updates
- [ ] Mark all as read → all cleared
- [ ] Click notification → navigates to client tasks tab

---

## Future Extensibility

To add new notification types (e.g., deals, clients):

1. Add type to `NotificationType` union in `lib/types/notification.ts`
2. Call `notifyAsync()` in relevant API routes
3. Optionally add lazy evaluation in `NotificationService.evaluateXxxNotifications()`
4. No migration needed (type is free-form string)
