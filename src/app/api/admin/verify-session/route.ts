import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'No session token' }, { status: 401 });
    }

    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    if (!secret || !process.env.JWT_SECRET_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    await jwtVerify(sessionToken, secret);
    
    return NextResponse.json({ success: true, authenticated: true });
  } catch (error) {
    console.error('Session verification failed:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
