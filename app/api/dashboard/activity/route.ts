/**
 * API Route: /api/dashboard/activity
 *
 * Get recent activity timeline (tasks, notes, deals)
 *
 * GET - Get combined timeline of recent activities
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/dashboard/activity
 *
 * Get recent activity across tasks, notes, and deals
 * Returns timeline items sorted by date (most recent first)
 *
 * Response:
 * - 200: Array of activity items
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

    // Get recent tasks (last 10)
    const { data: tasks, error: tasksError } = await supabase
      .from('client_tasks')
      .select(`
        id,
        title,
        status,
        priority,
        completed_at,
        updated_at,
        created_at,
        client:clients!client_tasks_client_id_fkey (
          id,
          name
        )
      `)
      .eq('assigned_to', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (tasksError) {
      console.error('Tasks fetch error:', tasksError);
    }

    // Get recent notes (last 10)
    const { data: notes, error: notesError } = await supabase
      .from('client_notes')
      .select(`
        id,
        content,
        is_important,
        created_at,
        client:clients!client_notes_client_id_fkey (
          id,
          name
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notesError) {
      console.error('Notes fetch error:', notesError);
    }

    // Get recent deals (last 10)
    const { data: deals, error: dealsError } = await supabase
      .from('deals')
      .select(`
        id,
        deal_name,
        deal_value,
        status,
        current_stage,
        created_at,
        updated_at,
        client:clients!deals_client_id_fkey (
          id,
          name
        ),
        deal_type:deal_types!deals_deal_type_id_fkey (
          type_name,
          icon
        )
      `)
      .eq('assigned_to', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (dealsError) {
      console.error('Deals fetch error:', dealsError);
    }

    // Combine and format activities
    const activities: Array<{
      id: string;
      type: 'task' | 'note' | 'deal';
      title: string;
      description?: string;
      date: string;
      status?: string;
      priority?: string;
      clientName?: string;
      clientId?: string;
    }> = [];

    // Add tasks
    if (tasks && tasks.length > 0) {
      tasks.forEach((task) => {
        const getTaskAction = (status: string) => {
          if (status === 'closed') return 'Task completed';
          if (status === 'in_progress') return 'Task updated';
          return 'Task created';
        };

        activities.push({
          id: task.id,
          type: 'task',
          title: getTaskAction(task.status),
          description: task.title,
          date:
            task.status === 'closed' && task.completed_at
              ? task.completed_at
              : task.updated_at,
          status: task.status,
          priority: task.priority,
          clientName: task.client?.name,
          clientId: task.client?.id,
        });
      });
    }

    // Add notes
    if (notes && notes.length > 0) {
      notes.forEach((note) => {
        const preview =
          note.content.length > 60
            ? `${note.content.substring(0, 60)}...`
            : note.content;

        activities.push({
          id: note.id,
          type: 'note',
          title: 'Note added',
          description: preview,
          date: note.created_at,
          clientName: note.client?.name,
          clientId: note.client?.id,
        });
      });
    }

    // Add deals
    if (deals && deals.length > 0) {
      deals.forEach((deal) => {
        const formatStage = (stage: string) => {
          return stage
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        };

        const dealValue = deal.deal_value
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(deal.deal_value)
          : 'Value not set';

        activities.push({
          id: deal.id,
          type: 'deal',
          title: 'Deal created',
          description: `${deal.deal_name} • ${formatStage(deal.current_stage)} • ${dealValue}`,
          date: deal.created_at,
          status: deal.status,
          clientName: deal.client?.name,
          clientId: deal.client?.id,
        });
      });
    }

    // Sort by date (most recent first) and limit to 15 items
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);

    return NextResponse.json(
      {
        success: true,
        data: sortedActivities,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard activity error:', error);

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
