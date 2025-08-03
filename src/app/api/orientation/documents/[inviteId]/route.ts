import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ inviteId: string }> }
) {
  try {
    // Await the params since they're now a Promise in Next.js 15
    const params = await context.params;
    
    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract inviteId from URL parameters
    const { inviteId } = params;

    // Validate inviteId
    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching orientation documents for inviteId:', inviteId);

    // First verify that the invite exists and is valid
    const { data: invite, error: inviteError } = await supabase
      .from('orientation_invites')
      .select('id, name, status')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      console.error('Invite not found:', inviteError);
      return NextResponse.json(
        { error: 'Invalid invite ID' },
        { status: 404 }
      );
    }

    // Fetch all documents for this specific invite ordered by display_order
    const { data: documents, error } = await supabase
      .from('user_documents')
      .select('id, title, content, display_order, created_at')
      .eq('invite_id', inviteId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${documents?.length || 0} documents for invite ${inviteId}`);

    // Return success response with documents
    return NextResponse.json({
      success: true,
      documents: documents || [],
      inviteName: invite.name
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
