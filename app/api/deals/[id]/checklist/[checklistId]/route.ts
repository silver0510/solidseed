/**
 * API Route: /api/deals/[id]/checklist/[checklistId]
 *
 * Manage individual checklist items
 *
 * PATCH - Update checklist item status/completion/name/date
 * DELETE - Delete checklist item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema for updating checklist items
const updateChecklistItemSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  completed_date: z.string().nullable().optional(),
  milestone_name: z.string().min(1).max(255).optional(),
  scheduled_date: z.string().nullable().optional(),
});

/**
 * PATCH /api/deals/[id]/checklist/[checklistId]
 *
 * Update checklist item status or completion
 *
 * Request body:
 * - status: string (optional) - One of: pending, completed, cancelled
 * - completed_date: string | null (optional) - ISO datetime when completed
 * - milestone_name: string (optional) - New checklist item name
 * - scheduled_date: string | null (optional) - New due date in YYYY-MM-DD format
 *
 * Response:
 * - 200: Checklist item updated successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 404: Checklist item or deal not found or access denied
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
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

    // Get deal ID and checklist ID from params
    const { id: dealId, checklistId } = await params;

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

    // Verify checklist item exists and belongs to this deal
    const { data: existingItem, error: itemError } = await supabase
      .from('deal_checklist_items')
      .select('id, milestone_name, status')
      .eq('id', checklistId)
      .eq('deal_id', dealId)
      .single();

    if (itemError || !existingItem) {
      return NextResponse.json(
        { error: 'Checklist item not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = updateChecklistItemSchema.parse(body);

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.completed_date !== undefined) updateData.completed_date = validatedData.completed_date;
    if (validatedData.milestone_name) updateData.milestone_name = validatedData.milestone_name;
    if (validatedData.scheduled_date !== undefined) updateData.scheduled_date = validatedData.scheduled_date;

    // Update checklist item
    const { data: updatedItem, error: updateError } = await supabase
      .from('deal_checklist_items')
      .update(updateData)
      .eq('id', checklistId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update checklist item:', updateError);
      return NextResponse.json(
        { error: 'Failed to update checklist item' },
        { status: 500 }
      );
    }

    // Log activity if status changed to completed
    if (validatedData.status === 'completed' && existingItem.status !== 'completed') {
      await supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          activity_type: 'milestone_complete',
          title: 'Checklist Item Completed',
          description: `Completed checklist item: ${existingItem.milestone_name}`,
          created_by: user.id,
        });
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedItem,
      },
      { status: 200 }
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

/**
 * DELETE /api/deals/[id]/checklist/[checklistId]
 *
 * Delete a checklist item
 *
 * Response:
 * - 200: Checklist item deleted successfully
 * - 401: Not authenticated
 * - 404: Checklist item or deal not found or access denied
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; checklistId: string }> }
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

    // Get deal ID and checklist ID from params
    const { id: dealId, checklistId } = await params;

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

    // Verify checklist item exists and belongs to this deal
    const { data: existingItem, error: itemError } = await supabase
      .from('deal_checklist_items')
      .select('id, milestone_name')
      .eq('id', checklistId)
      .eq('deal_id', dealId)
      .single();

    if (itemError || !existingItem) {
      return NextResponse.json(
        { error: 'Checklist item not found' },
        { status: 404 }
      );
    }

    // Delete checklist item
    const { error: deleteError } = await supabase
      .from('deal_checklist_items')
      .delete()
      .eq('id', checklistId);

    if (deleteError) {
      console.error('Failed to delete checklist item:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete checklist item' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        activity_type: 'other',
        title: 'Checklist Item Deleted',
        description: `Deleted checklist item: ${existingItem.milestone_name}`,
        created_by: user.id,
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Checklist item deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
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
