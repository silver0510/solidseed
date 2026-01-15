/**
 * TaskService handles all client task-related database operations
 *
 * Features:
 * - Add tasks to clients
 * - Update task details and status
 * - Delete tasks from clients
 * - Get all tasks for a client
 * - Get all tasks assigned to the current agent (for dashboard)
 * - Filter tasks by status, priority, due date
 *
 * Uses Supabase for data persistence with Row Level Security (RLS) policies
 * ensuring users can only access tasks for their own clients.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ClientTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskWithClient,
} from '@/lib/types/client';

// Initialize Supabase client at module level
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class TaskService {
  private supabase = supabase;

  /**
   * Initialize TaskService
   *
   * @throws {Error} If Supabase credentials are not configured
   */
  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials not configured. Please check your environment variables.');
    }
  }

  /**
   * Add a task to a client
   *
   * @param clientId - The client ID to add the task to
   * @param data - Task data containing title, due_date, and optional fields
   * @returns Promise<ClientTask> The created task record
   * @throws {Error} If user is not authenticated
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const task = await taskService.addTask('client_123', {
   *   title: 'Schedule property viewing',
   *   due_date: '2026-01-20',
   *   priority: 'high'
   * });
   * ```
   */
  async addTask(clientId: string, data: CreateTaskInput): Promise<ClientTask> {
    // Get authenticated user from Supabase auth
    const { data: userData, error: authError } = await this.supabase.auth.getUser();

    if (authError || !userData.user) {
      throw new Error('Not authenticated');
    }

    // Insert task into database
    const { data: task, error } = await this.supabase
      .from('client_tasks')
      .insert({
        client_id: clientId,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        priority: data.priority ?? 'medium',
        status: 'pending',
        created_by: userData.user.id,
        assigned_to: userData.user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return task;
  }

  /**
   * Update an existing task
   *
   * @param clientId - The client ID the task belongs to
   * @param taskId - The task ID to update
   * @param data - Updated task data
   * @returns Promise<ClientTask> The updated task record
   * @throws {Error} If task not found
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const task = await taskService.updateTask('client_123', 'task_456', {
   *   status: 'completed'
   * });
   * ```
   */
  async updateTask(clientId: string, taskId: string, data: UpdateTaskInput): Promise<ClientTask> {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.due_date !== undefined) {
      updateData.due_date = data.due_date;
    }
    if (data.priority !== undefined) {
      updateData.priority = data.priority;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Set completed_at when marking as completed
      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (data.status === 'pending') {
        updateData.completed_at = null;
      }
    }

    const { data: task, error } = await this.supabase
      .from('client_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return task;
  }

  /**
   * Delete a task from a client
   *
   * @param clientId - The client ID the task belongs to
   * @param taskId - The task ID to delete
   * @returns Promise<boolean> True if deletion succeeded
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * await taskService.deleteTask('client_123', 'task_456');
   * ```
   */
  async deleteTask(clientId: string, taskId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('client_tasks')
      .delete()
      .eq('id', taskId)
      .eq('client_id', clientId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  }

  /**
   * Get all tasks for a client
   *
   * Returns tasks ordered by due_date ascending (soonest first).
   *
   * @param clientId - The client ID to get tasks for
   * @returns Promise<ClientTask[]> Array of tasks
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * const tasks = await taskService.getTasksByClient('client_123');
   * ```
   */
  async getTasksByClient(clientId: string): Promise<ClientTask[]> {
    const { data, error } = await this.supabase
      .from('client_tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error('Failed to get tasks: ' + error.message);
    }

    return data || [];
  }

  /**
   * Get all tasks assigned to the current agent
   *
   * Returns tasks with client information for dashboard display.
   * Can be filtered by status, priority, and due date range.
   *
   * @param filters - Optional filters for status, priority, due dates
   * @returns Promise<TaskWithClient[]> Array of tasks with client names
   * @throws {Error} If user is not authenticated
   * @throws {Error} If database operation fails
   *
   * @example
   * ```typescript
   * // Get all tasks
   * const tasks = await taskService.getTasksByAgent();
   *
   * // Get pending high-priority tasks
   * const urgentTasks = await taskService.getTasksByAgent({
   *   status: 'pending',
   *   priority: 'high'
   * });
   * ```
   */
  async getTasksByAgent(filters?: TaskFilters): Promise<TaskWithClient[]> {
    // Get authenticated user
    const { data: userData, error: authError } = await this.supabase.auth.getUser();

    if (authError || !userData.user) {
      throw new Error('Not authenticated');
    }

    // Build query
    let query = this.supabase
      .from('client_tasks')
      .select('*, clients(first_name, last_name)')
      .eq('assigned_to', userData.user.id);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.due_before) {
      query = query.lte('due_date', filters.due_before);
    }
    if (filters?.due_after) {
      query = query.gte('due_date', filters.due_after);
    }

    const { data, error } = await query.order('due_date', { ascending: true });

    if (error) {
      throw new Error('Failed to get tasks: ' + error.message);
    }

    // Map to TaskWithClient format
    return (data || []).map((task) => ({
      ...task,
      client_name: task.clients
        ? `${task.clients.first_name} ${task.clients.last_name}`
        : 'Unknown Client',
    }));
  }
}
