import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Read user details from request body
    const body = await request.json();
    const {
      inviteId,
      name,
      personal_mail,
      phone_number,
      address,
      bank_account_number,
      aadhaar_photo_path,
      pan_card_photo_path
    } = body;

    // Validate required fields
    if (!inviteId || !name || !personal_mail || !phone_number || !address || !bank_account_number) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    console.log('Processing submission for inviteId:', inviteId);

    // Verify that the invite exists and is still pending
    const { data: invite, error: inviteError } = await supabase
      .from('orientation_invites')
      .select('id, name, status, email')
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      console.error('Invite not found:', inviteError);
      return NextResponse.json(
        { error: 'Invalid invite ID' },
        { status: 404 }
      );
    }

    if (invite.status === 'completed') {
      return NextResponse.json(
        { error: 'This onboarding has already been completed' },
        { status: 400 }
      );
    }

    // Append data to Google Sheets
    try {
      // Setup Google Sheets API
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;

      if (!spreadsheetId) {
        throw new Error('Google Sheet ID not configured');
      }

      // Append to Google Sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:J', // Adjust range as needed
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              new Date().toISOString(), // Column A: Timestamp
              name,                     // Column B: Name
              personal_mail,            // Column D: Personal Email
              phone_number,             // Column E: Phone
              address,                  // Column F: Address
              bank_account_number,      // Column G: Bank Account
              aadhaar_photo_path || '', // Column H: Aadhaar Path
              pan_card_photo_path || '',// Column I: PAN Path
            ]
          ],
        },
      });

      console.log('Successfully appended data to Google Sheet');
    } catch (googleError) {
      console.error('Error appending to Google Sheet:', googleError);
      return NextResponse.json(
        { error: 'Failed to save submission to Google Sheet' },
        { status: 500 }
      );
    }

    // Update invite status to completed
    const { error: updateError } = await supabase
      .from('orientation_invites')
      .update({ status: 'completed' })
      .eq('id', inviteId);

    if (updateError) {
      console.error('Error updating invite status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invite status' },
        { status: 500 }
      );
    }

    console.log('Successfully completed onboarding for inviteId:', inviteId);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
