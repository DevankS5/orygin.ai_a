import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This forces the route to be dynamic and prevents caching on the server.
export const dynamic = 'force-dynamic';

// Set runtime for Netlify compatibility
export const runtime = 'nodejs';

// Add CORS headers for better compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    console.log('Invites API: Starting request...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Invites API: Environment check - URL exists:', !!supabaseUrl);
    console.log('Invites API: Environment check - Service key exists:', !!supabaseServiceKey);

    // Check if the required environment variables are set
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Invites API: Missing environment variables');
      throw new Error('Supabase URL or Service Role Key is not configured in environment variables.');
    }

    // Create a server-side Supabase client with the powerful service_role key
    console.log('Invites API: Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all records from the 'orientation_invites' table
    console.log('Invites API: Fetching from orientation_invites table...');
    const { data, error } = await supabase
      .from('orientation_invites')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Invites API: Query result - error:', error);
    console.log('Invites API: Query result - data count:', data?.length || 0);

    // If Supabase returns an error, throw it to be caught by the catch block
    if (error) {
      console.error('Invites API: Supabase query error:', error);
      throw error;
    }

    // Return the data successfully with the expected format
    console.log('Invites API: Returning success response');
    return NextResponse.json({
      success: true,
      invites: data || []
    }, { 
      status: 200,
      headers: corsHeaders 
    });
  } catch (error: any) {
    // Log any errors to the server console for debugging
    console.error('Invites API: Caught error:', error);
    console.error('Invites API: Error message:', error.message);
    console.error('Invites API: Error stack:', error.stack);
    
    // Return a consistent error response to the client
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch invites.', 
      details: error.message,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}
