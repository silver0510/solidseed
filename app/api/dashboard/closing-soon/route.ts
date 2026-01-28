/**
 * API Route: /api/dashboard/closing-soon
 *
 * Get deals closing in the next 30 days
 *
 * GET - Get deals with expected_close_date in next 30 days
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/dashboard/closing-soon
 *
 * Get deals closing in next 30 days sorted by expected close date
 *
 * Response:
 * - 200: Array of deals with client info
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

    // Calculate date range
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get deals closing in next 30 days
    const { data: deals, error } = await supabase
      .from('deals')
      .select(`
        id,
        deal_name,
        deal_value,
        expected_close_date,
        current_stage,
        status,
        client:clients!deals_client_id_fkey (
          id,
          name,
          email
        ),
        deal_type:deal_types!deals_deal_type_id_fkey (
          type_name,
          icon,
          color
        )
      `)
      .eq('assigned_to', user.id)
      .eq('is_deleted', false)
      .eq('status', 'active')
      .gte('expected_close_date', today.toISOString().split('T')[0])
      .lte('expected_close_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('expected_close_date', { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(`Failed to fetch closing deals: ${error.message}`);
    }

    return NextResponse.json(
      {
        success: true,
        data: deals || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Closing soon deals error:', error);

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
