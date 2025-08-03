import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 401 }
      );
    }

    // Parse request body
    const { to, subject, htmlContent } = await request.json();

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, and htmlContent are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format for recipient' },
        { status: 400 }
      );
    }

    // Check for required environment variables
    if (!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
      console.error('Missing email server credentials in environment variables');
      return NextResponse.json(
        { success: false, error: 'Email server configuration is missing' },
        { status: 500 }
      );
    }

    // Create Nodemailer transporter for Spacemail
    const transporter = nodemailer.createTransport({
      host: 'smtp.privateemail.com',
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json(
        { success: false, error: 'Email server configuration error' },
        { status: 500 }
      );
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_SERVER_USER,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      subject: subject,
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        return NextResponse.json(
          { success: false, error: 'Invalid email server credentials' },
          { status: 500 }
        );
      } else if (error.message.includes('connection')) {
        return NextResponse.json(
          { success: false, error: 'Failed to connect to email server' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send email. Please try again.' },
      { status: 500 }
    );
  }
}
