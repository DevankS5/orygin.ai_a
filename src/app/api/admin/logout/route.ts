import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  // Tell the browser to delete the session cookie
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  // Redirect to the login page
  return NextResponse.redirect(new URL('/admin/login', 'http://localhost:3001')); // Replace with your actual domain in production
}
