import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  // --- Check credentials against environment variables ---
  const validUsername1 = process.env.ADMIN_1_USERNAME;
  const validPassword1 = process.env.ADMIN_1_PASSWORD;
  const validUsername2 = process.env.ADMIN_2_USERNAME;
  const validPassword2 = process.env.ADMIN_2_PASSWORD;

  const isValidUser1 = username === validUsername1 && password === validPassword1;
  const isValidUser2 = username === validUsername2 && password === validPassword2;

  if (!isValidUser1 && !isValidUser2) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // --- Create the JWT session token ---
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    if (!secret) {
      throw new Error('JWT_SECRET_KEY is not set in environment variables.');
    }

    const expirationTime = Math.floor(Date.now() / 1000) + 8 * 60 * 60; // 8 hours from now

    const token = await new SignJWT({ username: username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(secret);

    // --- Set the session cookie ---
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours in seconds
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
