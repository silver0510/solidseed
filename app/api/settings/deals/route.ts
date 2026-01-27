/**
 * Deal Settings API Routes
 *
 * GET: Fetch user's deal type settings and available deal types
 * PUT: Update checklist template for a specific deal type
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/auth/session';
import type {
  GetDealSettingsResponse,
  UpdateChecklistTemplateInput,
  UserDealTypeSetting,
} from '@/lib/types/deal-settings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const checklistTemplateItemSchema = z.object({
  name: z.string().min(1, 'Checklist item name is required').max(255),
  scheduled_date: z.string().optional().nullable(),
});

const updateChecklistTemplateSchema = z.object({
  deal_type_id: z.string().uuid('Invalid deal type ID'),
  checklist_template: z.array(checklistTemplateItemSchema),
});

// =====================================================
// GET: Fetch user's deal settings
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all deal types
    const { data: dealTypes, error: dealTypesError } = await supabase
      .from('deal_types')
      .select('id, type_name, type_code')
      .eq('is_active', true)
      .order('type_name');

    if (dealTypesError) {
      console.error('Error fetching deal types:', dealTypesError);
      return NextResponse.json(
        { error: 'Failed to fetch deal types' },
        { status: 500 }
      );
    }

    // Fetch user's existing settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_deal_type_settings')
      .select('*')
      .eq('user_id', userId);

    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    const response: GetDealSettingsResponse = {
      settings: settings || [],
      deal_types: dealTypes || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/settings/deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT: Update checklist template for a deal type
// =====================================================

export async function PUT(request: NextRequest) {
  try {
    // Validate session
    const { user, error: authError } = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateChecklistTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { deal_type_id, checklist_template } = validationResult.data;

    // Verify deal type exists
    const { data: dealType, error: dealTypeError } = await supabase
      .from('deal_types')
      .select('id')
      .eq('id', deal_type_id)
      .single();

    if (dealTypeError || !dealType) {
      return NextResponse.json(
        { error: 'Deal type not found' },
        { status: 404 }
      );
    }

    // Upsert the setting (insert or update if exists)
    const { data: setting, error: upsertError } = await supabase
      .from('user_deal_type_settings')
      .upsert(
        {
          user_id: userId,
          deal_type_id,
          checklist_template,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,deal_type_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting setting:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error in PUT /api/settings/deals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
