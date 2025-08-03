import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Read email and OTP from request body
    const body = await request.json();
    const { email, otp, inviteId } = body;

    // Validate required fields
    if (!email || !otp || !inviteId) {
      return NextResponse.json(
        { error: 'Email, OTP, and invite ID are required' },
        { status: 400 }
      );
    }

    console.log('Verifying OTP for email:', email, 'inviteId:', inviteId);

    // Find the invite with matching email and inviteId
    const { data: invite, error } = await supabase
      .from('orientation_invites')
      .select('id, name, email, otp, status')
      .eq('email', email.trim())
      .eq('id', inviteId)
      .single();

    if (error || !invite) {
      console.error('Invite not found:', error);
      return NextResponse.json(
        { error: 'Invalid email or invite ID' },
        { status: 401 }
      );
    }

    if (invite.status === 'completed') {
      return NextResponse.json(
        { error: 'This onboarding has already been completed' },
        { status: 400 }
      );
    }

    // Verify the OTP
    const isValidOtp = await bcrypt.compare(otp.trim(), invite.otp);
    
    if (!isValidOtp) {
      console.log('Invalid OTP provided');
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    console.log('OTP verification successful for:', email);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      inviteId: invite.id,
      name: invite.name
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
