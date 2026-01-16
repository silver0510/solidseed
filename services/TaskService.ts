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
 * Uses Supabase with service role key for server-side operations.
 * Authorization is handled in API routes via Better Auth session validation.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  ClientTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskWithClient,
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

export class TaskService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseAdmin();
  }

  /**
   * Add a task to a client
   */
  async addTask(clientId: string, data: CreateTaskInput, userId: string): Promise<ClientTask> {
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

    const { data: task, error } = await this.supabase
      .from('client_tasks')
      .insert({
        client_id: clientId,
        title: data.title,
        description: data.description,
        due_date: data.due_date,
        priority: data.priority ?? 'medium',
        status: 'pending',
        created_by: userId,
        assigned_to: userId,
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
   */
  async updateTask(
    clientId: string,
    taskId: string,
    data: UpdateTaskInput,
    userId: string
  ): Promise<ClientTask> {
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
   */
  async deleteTask(clientId: string, taskId: string, userId: string): Promise<boolean> {
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
   */
  async getTasksByClient(clientId: string, userId: string): Promise<ClientTask[]> {
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
   * Get all tasks assigned to a user (for task dashboard)
   */
  async getTasksByAgent(userId: string, filters?: TaskFilters): Promise<TaskWithClient[]> {
    let query = this.supabase
      .from('client_tasks')
      .select('*, clients(first_name, last_name)')
      .eq('assigned_to', userId);

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

    return (data || []).map((task) => ({
      ...task,
      client_name: task.clients
        ? `${task.clients.first_name} ${task.clients.last_name}`
        : 'Unknown Client',
    }));
  }
}
