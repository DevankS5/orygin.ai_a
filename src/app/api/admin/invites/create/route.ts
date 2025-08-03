import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
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

    // Read name, email, and custom otp from request body
    const body = await request.json();
    const { name, email, otp } = body;

    // Validate required fields
    if (!name || !email || !otp) {
      return NextResponse.json(
        { error: 'Name, email, and OTP are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate OTP format (should be a string, can be custom)
    if (typeof otp !== 'string' || otp.trim().length === 0) {
      return NextResponse.json(
        { error: 'OTP must be a non-empty string' },
        { status: 400 }
      );
    }

    // Hash the provided OTP before storing
    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp.trim(), saltRounds);

    // Insert new invite into the orientation_invites table
    const { data: newInvite, error } = await adminSupabase
      .from('orientation_invites')
      .insert({
        name: name.trim(),
        email: email.trim(),
        otp: hashedOtp,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create invite', details: error.message },
        { status: 500 }
      );
    }

    // Return success response with the newly created invite object
    return NextResponse.json({
      success: true,
      message: 'Invitation created successfully',
      invite: {
        id: newInvite.id,
        name: newInvite.name,
        email: newInvite.email,
        status: newInvite.status,
        created_at: newInvite.created_at
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
