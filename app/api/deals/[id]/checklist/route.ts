/**
 * API Route: /api/deals/[id]/checklist
 *
 * Manage deal checklist items
 *
 * POST - Create a new checklist item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema for creating checklist items
const createChecklistItemSchema = z.object({
  name: z.string().min(1, 'Checklist item name is required').max(255, 'Name must be less than 255 characters'),
  due_date: z.string().optional().nullable(),
});

/**
 * POST /api/deals/[id]/checklist
 *
 * Create a new checklist item for the deal
 *
 * Request body:
 * - name: string (required) - Checklist item name (max 255 chars)
 * - due_date: string (optional/nullable) - Due date in YYYY-MM-DD format
 *
 * Response:
 * - 201: Checklist item created successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 404: Deal not found or access denied
 * - 500: Internal server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get deal ID from params
    const { id: dealId } = await params;

    // Verify deal exists and user has access
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('id, created_by')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Deal not found or access denied' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = createChecklistItemSchema.parse(body);

    // Create checklist item
    const { data: checklistItem, error: insertError } = await supabase
      .from('deal_checklist_items')
      .insert({
        deal_id: dealId,
        milestone_name: validatedData.name,
        scheduled_date: validatedData.due_date || null,
        status: 'pending',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create checklist item:', insertError);
      return NextResponse.json(
        { error: 'Failed to create checklist item' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        activity_type: 'other',
        title: 'Checklist Item Added',
        description: `Added checklist item: ${validatedData.name}`,
        created_by: user.id,
      });

    return NextResponse.json(
      {
        success: true,
        data: checklistItem,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues,
        },
        { status: 400 }
      );
    }

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
