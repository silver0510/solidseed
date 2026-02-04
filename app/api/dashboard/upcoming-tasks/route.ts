/**
 * API Route: /api/dashboard/upcoming-tasks
 *
 * Get upcoming tasks for the dashboard
 *
 * GET - Get tasks due soon (today, overdue, and upcoming)
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/dashboard/upcoming-tasks
 *
 * Get upcoming tasks sorted by due date (overdue first, then by date)
 * Includes client name for context
 *
 * Response:
 * - 200: Array of tasks with client info
 * - 401: Not authenticated
 * - 500: Internal server error
 */
export async function GET() {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get upcoming tasks (open and in_progress, sorted by due date)
    const { data: tasks, error } = await supabase
      .from('client_tasks')
      .select(`
        id,
        title,
        description,
        due_date,
        priority,
        status,
        client:clients!client_tasks_client_id_fkey (
          id,
          name
        )
      `)
      .eq('assigned_to', user.id)
      .in('status', ['open', 'in_progress'])
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch upcoming tasks: ${error.message}`);
    }

    // Sort tasks: overdue first, then by due date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedTasks = (tasks || []).map(task => {
      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const isOverdue = dueDate < today;
      const isToday = dueDate.getTime() === today.getTime();

      return {
        ...task,
        is_overdue: isOverdue,
        is_today: isToday,
      };
    }).sort((a, b) => {
      // Overdue tasks first
      if (a.is_overdue && !b.is_overdue) return -1;
      if (!a.is_overdue && b.is_overdue) return 1;
      // Then by due date
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    return NextResponse.json(
      {
        success: true,
        data: sortedTasks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upcoming tasks error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
