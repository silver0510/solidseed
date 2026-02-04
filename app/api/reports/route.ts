/**
 * API Route: /api/reports
 *
 * Get comprehensive reports and statistics for the current user
 *
 * GET - Get career/all-time statistics with optional period filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';

interface PeriodStats {
  period: string;
  won_value: number;
  won_count: number;
  lost_count: number;
  commission_earned: number;
}

interface DealTypeBreakdown {
  deal_type_id: string;
  type_name: string;
  count: number;
  total_value: number;
  commission_earned: number;
}

/**
 * GET /api/reports
 *
 * Get comprehensive reports including:
 * - Total Won (All-time)
 * - Won by Year/Quarter/Month
 * - Win Rate
 * - Average Deal Size
 * - Average Days to Close
 * - Deals by Type breakdown
 * - Commission Earned (total and by period)
 *
 * Query parameters:
 * - period: 'month' | 'quarter' | 'year' (default: 'month')
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('period') || 'month';

    // 1. Get ALL closed deals (won and lost) for calculations
    const { data: allClosedDeals, error: closedError } = await supabase
      .from('deals')
      .select(`
        id,
        deal_value,
        agent_commission,
        status,
        closed_at,
        actual_close_date,
        days_in_pipeline,
        deal_type_id,
        created_at
      `)
      .eq('assigned_to', user.id)
      .eq('is_deleted', false)
      .in('status', ['closed_won', 'closed_lost']);

    if (closedError) {
      throw new Error(`Failed to fetch closed deals: ${closedError.message}`);
    }

    const deals = allClosedDeals || [];
    const wonDeals = deals.filter(d => d.status === 'closed_won');
    const lostDeals = deals.filter(d => d.status === 'closed_lost');

    // 2. Calculate all-time statistics
    const totalWonValue = wonDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
    const totalWonCount = wonDeals.length;
    const totalLostCount = lostDeals.length;
    const totalClosedCount = deals.length;
    const winRate = totalClosedCount > 0
      ? Math.round((totalWonCount / totalClosedCount) * 100)
      : 0;

    const averageDealSize = totalWonCount > 0
      ? Math.round(totalWonValue / totalWonCount)
      : 0;

    // Average days to close (only for won deals with valid days_in_pipeline)
    const dealsWithDays = wonDeals.filter(d => d.days_in_pipeline != null);
    const averageDaysToClose = dealsWithDays.length > 0
      ? Math.round(dealsWithDays.reduce((sum, d) => sum + d.days_in_pipeline, 0) / dealsWithDays.length)
      : 0;

    const totalCommissionEarned = wonDeals.reduce((sum, d) => sum + (d.agent_commission || 0), 0);

    // 3. Group by period (month/quarter/year)
    const periodStats = groupByPeriod(wonDeals, lostDeals, periodType);

    // 4. Get deal types for breakdown
    const { data: dealTypes } = await supabase
      .from('deal_types')
      .select('id, type_name')
      .eq('is_active', true);

    const dealTypeMap = new Map((dealTypes || []).map(dt => [dt.id, dt.type_name]));

    // 5. Calculate deals by type breakdown (won deals only)
    const dealsByType = calculateDealsByType(wonDeals, dealTypeMap);

    return NextResponse.json({
      success: true,
      data: {
        // All-time summary
        all_time: {
          total_won_value: totalWonValue,
          total_won_count: totalWonCount,
          total_lost_count: totalLostCount,
          win_rate: winRate,
          average_deal_size: averageDealSize,
          average_days_to_close: averageDaysToClose,
          total_commission_earned: totalCommissionEarned,
        },
        // Period breakdown (most recent first)
        by_period: periodStats,
        // Deal type breakdown
        by_type: dealsByType,
      },
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

function groupByPeriod(
  wonDeals: any[],
  lostDeals: any[],
  periodType: string
): PeriodStats[] {
  const periodMap = new Map<string, PeriodStats>();

  // Process won deals
  for (const deal of wonDeals) {
    const closedAt = deal.closed_at ? new Date(deal.closed_at) : null;
    if (!closedAt) continue;

    const periodKey = getPeriodKey(closedAt, periodType);

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        won_value: 0,
        won_count: 0,
        lost_count: 0,
        commission_earned: 0,
      });
    }

    const stats = periodMap.get(periodKey)!;
    stats.won_value += deal.deal_value || 0;
    stats.won_count += 1;
    stats.commission_earned += deal.agent_commission || 0;
  }

  // Process lost deals
  for (const deal of lostDeals) {
    const closedAt = deal.closed_at ? new Date(deal.closed_at) : null;
    if (!closedAt) continue;

    const periodKey = getPeriodKey(closedAt, periodType);

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        won_value: 0,
        won_count: 0,
        lost_count: 0,
        commission_earned: 0,
      });
    }

    periodMap.get(periodKey)!.lost_count += 1;
  }

  // Sort by period descending and limit
  const limit = periodType === 'year' ? 5 : periodType === 'quarter' ? 8 : 12;
  return Array.from(periodMap.values())
    .sort((a, b) => b.period.localeCompare(a.period))
    .slice(0, limit);
}

function getPeriodKey(date: Date, periodType: string): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (periodType) {
    case 'year':
      return `${year}`;
    case 'quarter':
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    case 'month':
    default:
      return `${year}-${month.toString().padStart(2, '0')}`;
  }
}

function calculateDealsByType(
  wonDeals: any[],
  dealTypeMap: Map<string, string>
): DealTypeBreakdown[] {
  const typeMap = new Map<string, DealTypeBreakdown>();

  for (const deal of wonDeals) {
    const typeId = deal.deal_type_id;
    const typeName = dealTypeMap.get(typeId) || 'Unknown';

    if (!typeMap.has(typeId)) {
      typeMap.set(typeId, {
        deal_type_id: typeId,
        type_name: typeName,
        count: 0,
        total_value: 0,
        commission_earned: 0,
      });
    }

    const stats = typeMap.get(typeId)!;
    stats.count += 1;
    stats.total_value += deal.deal_value || 0;
    stats.commission_earned += deal.agent_commission || 0;
  }

  // Sort by count descending
  return Array.from(typeMap.values())
    .sort((a, b) => b.count - a.count);
}
