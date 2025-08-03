import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This forces the route to be dynamic and prevents caching on the server.
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Check if the required environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured in environment variables.');
    }

    // Create a server-side Supabase client with the powerful service_role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all records from the 'orientation_invites' table
    const { data, error } = await supabase
      .from('orientation_invites')
      .select('*')
      .order('created_at', { ascending: false });

    // If Supabase returns an error, throw it to be caught by the catch block
    if (error) {
      throw error;
    }

    // Return the data successfully with the expected format
    return NextResponse.json({
      success: true,
      invites: data || []
    });
  } catch (error: any) {
    // Log any errors to the server console for debugging
    console.error('Error fetching invites:', error);
    // Return a consistent error response to the client
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch invites.', 
      details: error.message 
    }, { status: 500 });
  }
}
