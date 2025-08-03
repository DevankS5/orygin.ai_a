import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Create authenticated Supabase client for session verification
    const cookieStore = await cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Verify admin session
    const { data: { session }, error: authError } = await authSupabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Create service role client for database operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Read inviteId from request body
    const body = await request.json();
    const { inviteId } = body;

    // Validate required field
    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting invite with ID:', inviteId);

    // First, check if the invite exists
    const { data: existingInvite, error: checkError } = await adminSupabase
      .from('orientation_invites')
      .select('id, name, email')
      .eq('id', inviteId)
      .single();

    if (checkError || !existingInvite) {
      console.error('Invite not found:', checkError);
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    // Delete related documents first (if any)
    const { error: documentsDeleteError } = await adminSupabase
      .from('user_documents')
      .delete()
      .eq('invite_id', inviteId);

    if (documentsDeleteError) {
      console.error('Error deleting related documents:', documentsDeleteError);
      // Continue with invite deletion even if document deletion fails
    }

    // Delete the invite
    const { error: deleteError } = await adminSupabase
      .from('orientation_invites')
      .delete()
      .eq('id', inviteId);

    if (deleteError) {
      console.error('Error deleting invite:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete invite', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('Successfully deleted invite:', existingInvite.name, existingInvite.email);

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Invite for ${existingInvite.name} has been deleted successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
