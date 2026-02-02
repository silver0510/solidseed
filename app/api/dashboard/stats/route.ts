/**
 * API Route: /api/dashboard/stats
 *
 * Get dashboard statistics for the current user
 *
 * GET - Get aggregated dashboard metrics
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/dashboard/stats
 *
 * Get dashboard statistics including:
 * - Pipeline value and active deals
 * - Total clients count
 * - Hot deals (closing in next 30 days)
 * - Expected commission
 * - Tasks due today and overdue
 *
 * Response:
 * - 200: Dashboard statistics
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

    // Get all active deals for pipeline value and count
    const { data: activeDeals, error: activeError } = await supabase
      .from('deals')
      .select('deal_value, commission_amount, expected_close_date')
      .eq('assigned_to', user.id)
      .eq('is_deleted', false)
      .eq('status', 'active');

    if (activeError) {
      throw new Error(`Failed to fetch active deals: ${activeError.message}`);
    }

    // Calculate pipeline value
    const pipelineValue = (activeDeals || []).reduce((sum, deal) => {
      return sum + (deal.deal_value || 0);
    }, 0);

    // Calculate expected commission
    const expectedCommission = (activeDeals || []).reduce((sum, deal) => {
      return sum + (deal.commission_amount || 0);
    }, 0);

    // Count hot deals (closing in next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const hotDealsCount = (activeDeals || []).filter((deal) => {
      if (!deal.expected_close_date) return false;
      const closeDate = new Date(deal.expected_close_date);
      return closeDate >= today && closeDate <= thirtyDaysFromNow;
    }).length;

    // Get total clients count
    const { count: clientsCount, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('is_deleted', false);

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    // Get closed deals for comparison data (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const { data: closedDeals, error: closedError } = await supabase
      .from('deals')
      .select('status')
      .eq('assigned_to', user.id)
      .eq('is_deleted', false)
      .in('status', ['closed_won', 'closed_lost'])
      .gte('closed_at', ninetyDaysAgo.toISOString());

    if (closedError) {
      throw new Error(`Failed to fetch closed deals: ${closedError.message}`);
    }

    // Calculate won/lost deals for comparison
    const wonDeals = (closedDeals || []).filter((d) => d.status === 'closed_won').length;
    const totalClosed = (closedDeals || []).length;

    // Get tasks due today
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const { data: tasksDueToday, error: tasksError } = await supabase
      .from('client_tasks')
      .select('id')
      .eq('assigned_to', user.id)
      .eq('status', 'open')
      .gte('due_date', todayStart.toISOString().split('T')[0])
      .lt('due_date', todayEnd.toISOString().split('T')[0]);

    if (tasksError) {
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    // Get overdue tasks
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('client_tasks')
      .select('id')
      .eq('assigned_to', user.id)
      .eq('status', 'open')
      .lt('due_date', todayStart.toISOString().split('T')[0]);

    if (overdueError) {
      throw new Error(`Failed to fetch overdue tasks: ${overdueError.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          pipeline_value: pipelineValue,
          active_deals_count: (activeDeals || []).length,
          total_clients: clientsCount || 0,
          hot_deals_count: hotDealsCount,
          expected_commission: expectedCommission,
          tasks_due_today: (tasksDueToday || []).length,
          overdue_tasks: (overdueTasks || []).length,
          // Comparison data (for showing trends)
          comparison: {
            won_last_90_days: wonDeals,
            lost_last_90_days: totalClosed - wonDeals,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dashboard stats error:', error);

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
