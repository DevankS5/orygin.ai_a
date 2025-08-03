import { NextResponse } from 'next/server';

// This forces the route to be dynamic and prevents caching on the server.
export const dynamic = 'force-dynamic';

// Set runtime for Netlify compatibility
export const runtime = 'nodejs';

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    console.log('Health check:', { timestamp, environment });

    return NextResponse.json({
      status: 'ok',
      timestamp,
      environment,
      message: 'API is working correctly'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}
