import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      console.error('Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Create Supabase client with service role for admin operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Attempting to fetch invites from orientation_invites table...');

    // Fetch all records from the orientation_invites table
    const { data: invites, error } = await adminSupabase
      .from('orientation_invites')
      .select('id, name, email, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error details:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to fetch invites', 
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${invites?.length || 0} invites`);

    // Return the list of invites as a JSON array
    return NextResponse.json({
      success: true,
      invites: invites || []
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
