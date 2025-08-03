import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This forces the route to be dynamic, preventing caching issues.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Ensure environment variables are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured.');
    }

    // Create a server-side client with the service_role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all invites
    const { data, error } = await supabase
      .from('orientation_invites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Throw the error to be caught by the catch block
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
