import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    message: 'Hello from API!', 
    timestamp: new Date().toISOString() 
  });
}
