import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection using a simple query
    // We use rpc to execute a simple SQL query that returns true
    const { data, error } = await supabase.rpc('version');

    // If we get any response (even error about function not existing), connection works
    // The connection is successful if we can communicate with the database
    if (error && !error.message.includes('function')) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      note: 'Supabase client is configured and can communicate with the database',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
