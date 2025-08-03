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

    // Read invite_id, title, content, and display_order from request body
    const body = await request.json();
    const { invite_id, title, content, display_order } = body;

    // Validate required fields
    if (!invite_id || !title || !content) {
      return NextResponse.json(
        { error: 'Invite ID, title, and content are required' },
        { status: 400 }
      );
    }

    // Validate display_order is a number if provided
    if (display_order !== undefined && (typeof display_order !== 'number' || display_order < 0)) {
      return NextResponse.json(
        { error: 'Display order must be a positive number' },
        { status: 400 }
      );
    }

    // Validate that the invite_id exists
    const { data: invite, error: inviteError } = await adminSupabase
      .from('orientation_invites')
      .select('id')
      .eq('id', invite_id)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid invite ID' },
        { status: 400 }
      );
    }

    // Prepare the document data
    const documentData = {
      invite_id,
      title: title.trim(),
      content: content.trim(),
      display_order: display_order || 0,
      created_at: new Date().toISOString()
    };

    // Insert new document into the user_documents table
    const { data: newDocument, error } = await adminSupabase
      .from('user_documents')
      .insert(documentData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Document created successfully',
      document: {
        id: newDocument.id,
        invite_id: newDocument.invite_id,
        title: newDocument.title,
        content: newDocument.content,
        display_order: newDocument.display_order,
        created_at: newDocument.created_at
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
