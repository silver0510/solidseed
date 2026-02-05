/**
 * API Route: /api/clients/stats
 *
 * Get client statistics for the current user's clients page metrics
 *
 * GET - Get aggregated client metrics
 */

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';

interface ClientForFollowup {
  id: string;
  name: string;
  email: string;
  last_note_date: string | null;
}

interface ClientForBirthday {
  id: string;
  name: string;
  birthday: string;
  days_until: number;
}

/**
 * GET /api/clients/stats
 *
 * Get client statistics including:
 * - Total clients count
 * - New clients this month
 * - Clients needing follow-up (no notes in 30+ days)
 * - Clients with upcoming birthdays (next 30 days)
 *
 * Response:
 * - 200: Client statistics
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

    const today = new Date();

    // 1. Get total clients count
    const { count: totalClients, error: totalError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('is_deleted', false);

    if (totalError) {
      throw new Error(`Failed to fetch total clients: ${totalError.message}`);
    }

    // 2. Get new clients this month
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const { count: newThisMonth, error: newError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', user.id)
      .eq('is_deleted', false)
      .gte('created_at', firstDayOfMonth.toISOString());

    if (newError) {
      throw new Error(`Failed to fetch new clients: ${newError.message}`);
    }

    // 3. Get clients needing follow-up (no notes in 30+ days or no notes at all)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Get all clients with their latest note date
    const { data: clientsWithNotes, error: followupError } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        client_notes (
          created_at
        )
      `)
      .eq('assigned_to', user.id)
      .eq('is_deleted', false);

    if (followupError) {
      throw new Error(`Failed to fetch clients for follow-up: ${followupError.message}`);
    }

    // Process to find clients needing follow-up
    const needFollowupClients: ClientForFollowup[] = [];

    for (const client of clientsWithNotes || []) {
      const notes = client.client_notes as Array<{ created_at: string }> || [];

      if (notes.length === 0) {
        // No notes at all - needs follow-up
        needFollowupClients.push({
          id: client.id,
          name: client.name,
          email: client.email,
          last_note_date: null,
        });
      } else {
        // Find the most recent note
        const sortedNotes = notes.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latestNote = sortedNotes[0];
        if (latestNote) {
          const lastNoteDate = new Date(latestNote.created_at);

          if (lastNoteDate < thirtyDaysAgo) {
            needFollowupClients.push({
              id: client.id,
              name: client.name,
              email: client.email,
              last_note_date: latestNote.created_at,
            });
          }
        }
      }
    }

    // Sort by last_note_date (null first, then oldest)
    needFollowupClients.sort((a, b) => {
      if (a.last_note_date === null && b.last_note_date === null) return 0;
      if (a.last_note_date === null) return -1;
      if (b.last_note_date === null) return 1;
      return new Date(a.last_note_date).getTime() - new Date(b.last_note_date).getTime();
    });

    // 4. Get clients with birthdays in the next 30 days
    const { data: clientsWithBirthdays, error: birthdayError } = await supabase
      .from('clients')
      .select('id, name, birthday')
      .eq('assigned_to', user.id)
      .eq('is_deleted', false)
      .not('birthday', 'is', null);

    if (birthdayError) {
      throw new Error(`Failed to fetch clients with birthdays: ${birthdayError.message}`);
    }

    // Calculate days until birthday for each client
    const birthdaysSoonClients: ClientForBirthday[] = [];

    for (const client of clientsWithBirthdays || []) {
      if (!client.birthday) continue;

      const birthday = new Date(client.birthday);
      const thisYearBirthday = new Date(
        today.getFullYear(),
        birthday.getMonth(),
        birthday.getDate()
      );

      // If birthday already passed this year, check next year
      let nextBirthday = thisYearBirthday;
      if (thisYearBirthday < today) {
        nextBirthday = new Date(
          today.getFullYear() + 1,
          birthday.getMonth(),
          birthday.getDate()
        );
      }

      // Calculate days until birthday
      const diffTime = nextBirthday.getTime() - today.getTime();
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Include if within 30 days
      if (daysUntil >= 0 && daysUntil <= 30) {
        birthdaysSoonClients.push({
          id: client.id,
          name: client.name,
          birthday: client.birthday,
          days_until: daysUntil,
        });
      }
    }

    // Sort by days until birthday (soonest first)
    birthdaysSoonClients.sort((a, b) => a.days_until - b.days_until);

    return NextResponse.json(
      {
        success: true,
        data: {
          total_clients: totalClients || 0,
          new_this_month: newThisMonth || 0,
          need_followup: {
            count: needFollowupClients.length,
            clients: needFollowupClients.slice(0, 10), // Limit to 10 for display
          },
          birthdays_soon: {
            count: birthdaysSoonClients.length,
            clients: birthdaysSoonClients.slice(0, 10), // Limit to 10 for display
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Client stats error:', error);

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
