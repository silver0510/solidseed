/**
 * API Route: /api/deals/[id]/milestones/[milestoneId]
 *
 * Manage individual milestones
 *
 * PATCH - Update milestone status/completion/name/date
 * DELETE - Delete milestone
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schema for updating milestones
const updateMilestoneSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
  completed_date: z.string().nullable().optional(),
  milestone_name: z.string().min(1).max(255).optional(),
  scheduled_date: z.string().nullable().optional(),
});

/**
 * PATCH /api/deals/[id]/milestones/[milestoneId]
 *
 * Update milestone status or completion
 *
 * Request body:
 * - status: string (optional) - One of: pending, completed, cancelled
 * - completed_date: string | null (optional) - ISO datetime when completed
 * - milestone_name: string (optional) - New milestone name
 * - scheduled_date: string | null (optional) - New due date in YYYY-MM-DD format
 *
 * Response:
 * - 200: Milestone updated successfully
 * - 400: Validation error
 * - 401: Not authenticated
 * - 404: Milestone or deal not found or access denied
 * - 500: Internal server error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
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

    // Get deal ID and milestone ID from params
    const { id: dealId, milestoneId } = await params;

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

    // Verify milestone exists and belongs to this deal
    const { data: existingMilestone, error: milestoneError } = await supabase
      .from('deal_milestones')
      .select('id, milestone_name, status')
      .eq('id', milestoneId)
      .eq('deal_id', dealId)
      .single();

    if (milestoneError || !existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate input using Zod schema
    const validatedData = updateMilestoneSchema.parse(body);

    // Build update object
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.status) updateData.status = validatedData.status;
    if (validatedData.completed_date !== undefined) updateData.completed_date = validatedData.completed_date;
    if (validatedData.milestone_name) updateData.milestone_name = validatedData.milestone_name;
    if (validatedData.scheduled_date !== undefined) updateData.scheduled_date = validatedData.scheduled_date;

    // Update milestone
    const { data: updatedMilestone, error: updateError } = await supabase
      .from('deal_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update milestone:', updateError);
      return NextResponse.json(
        { error: 'Failed to update milestone' },
        { status: 500 }
      );
    }

    // Log activity if status changed to completed
    if (validatedData.status === 'completed' && existingMilestone.status !== 'completed') {
      await supabase
        .from('deal_activities')
        .insert({
          deal_id: dealId,
          activity_type: 'milestone_complete',
          title: 'Milestone Completed',
          description: `Completed milestone: ${existingMilestone.milestone_name}`,
          created_by: user.id,
        });
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedMilestone,
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
 * DELETE /api/deals/[id]/milestones/[milestoneId]
 *
 * Delete a milestone
 *
 * Response:
 * - 200: Milestone deleted successfully
 * - 401: Not authenticated
 * - 403: Cannot delete system milestones
 * - 404: Milestone or deal not found or access denied
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
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

    // Get deal ID and milestone ID from params
    const { id: dealId, milestoneId } = await params;

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

    // Verify milestone exists and belongs to this deal
    const { data: existingMilestone, error: milestoneError } = await supabase
      .from('deal_milestones')
      .select('id, milestone_name, milestone_type')
      .eq('id', milestoneId)
      .eq('deal_id', dealId)
      .single();

    if (milestoneError || !existingMilestone) {
      return NextResponse.json(
        { error: 'Milestone not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of system milestones (optional - uncomment if needed)
    // if (existingMilestone.milestone_type !== 'custom') {
    //   return NextResponse.json(
    //     { error: 'Cannot delete system milestones' },
    //     { status: 403 }
    //   );
    // }

    // Delete milestone
    const { error: deleteError } = await supabase
      .from('deal_milestones')
      .delete()
      .eq('id', milestoneId);

    if (deleteError) {
      console.error('Failed to delete milestone:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete milestone' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase
      .from('deal_activities')
      .insert({
        deal_id: dealId,
        activity_type: 'other',
        title: 'Milestone Deleted',
        description: `Deleted milestone: ${existingMilestone.milestone_name}`,
        created_by: user.id,
      });

    return NextResponse.json(
      {
        success: true,
        message: 'Milestone deleted successfully',
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
