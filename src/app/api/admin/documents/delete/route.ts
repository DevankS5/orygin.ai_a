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

    // Read documentId from request body
    const body = await request.json();
    const { documentId } = body;

    // Validate required field
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting document with ID:', documentId);

    // First, check if the document exists
    const { data: existingDocument, error: checkError } = await adminSupabase
      .from('user_documents')
      .select('id, title, invite_id')
      .eq('id', documentId)
      .single();

    if (checkError || !existingDocument) {
      console.error('Document not found:', checkError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete the document
    const { error: deleteError } = await adminSupabase
      .from('user_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    console.log('Document deleted successfully:', {
      id: documentId,
      title: existingDocument.title
    });

    return NextResponse.json({
      message: 'Document deleted successfully',
      documentId: documentId,
      title: existingDocument.title
    });

  } catch (error) {
    console.error('Unexpected error during document deletion:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
