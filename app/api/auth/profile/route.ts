/**
 * User Profile API
 *
 * GET - Get current user profile
 * PUT - Update current user profile (name, phone, avatar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/auth/session';

/**
 * Create Supabase admin client with service role key
 * This bypasses RLS policies - only use on server side
 */
function createSupabaseAdmin() {
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

export async function GET() {
  try {
    // Get session user
    const { user: sessionUser, error: authError } = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: authError || 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get full user profile from database
    const supabase = createSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, image, subscription_tier, trial_expires_at')
      .eq('id', sessionUser.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        image: user.image,
        subscription_tier: user.subscription_tier,
        trial_expires_at: user.trial_expires_at,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get session user
    const { user: sessionUser, error: authError } = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: authError || 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { full_name, phone, image } = body;

    // Validate input
    if (full_name !== undefined && typeof full_name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid full_name' },
        { status: 400 }
      );
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid phone' },
        { status: 400 }
      );
    }

    if (image !== undefined && typeof image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid image' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) {
      updateData.full_name = full_name.trim() || null;
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim() || null;
    }

    if (image !== undefined) {
      updateData.image = image || null;
    }

    // Update user in database
    const supabase = createSupabaseAdmin();
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', sessionUser.id)
      .select('id, email, full_name, phone, image, subscription_tier, trial_expires_at')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        image: user.image,
        subscription_tier: user.subscription_tier,
        trial_expires_at: user.trial_expires_at,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
