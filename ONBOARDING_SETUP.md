# User-Facing Onboarding Flow Setup

This document outlines the complete user-facing onboarding flow that has been implemented.

## 🚀 Features Implemented

### Backend APIs
- ✅ **GET /api/orientation/documents/[inviteId]** - Fetch user-specific documents
- ✅ **POST /api/orientation/verify** - Verify user OTP and email
- ✅ **POST /api/orientation/submit** - Submit user details to Google Sheets

### Frontend Components
- ✅ **Server Component**: `/onboarding/[id]/page.tsx` - Main container with invite validation
- ✅ **Client Component**: `OnboardingFlow.tsx` - Multi-step flow controller with progress indicator
- ✅ **Client Component**: `OtpForm.tsx` - Email and OTP verification form
- ✅ **Client Component**: `DetailsForm.tsx` - User details form with file uploads
- ✅ **Client Component**: `ContentDisplay.tsx` - Markdown content display with custom styling

## 🎨 Design Features

### Theme Consistency
- Dark theme matching orygin.ai website
- Purple and pink gradients
- Modern fonts and spacing
- Responsive design
- Smooth animations and transitions

### User Experience
- 3-step progress indicator
- Real-time form validation
- File upload with progress feedback
- Error handling and user feedback
- Mobile-responsive layout

## 🔧 Setup Requirements

### 1. Environment Variables
Add these to your `.env.local` file:

```bash
# Google Sheets Configuration
GOOGLE_CLIENT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=your-google-service-account-private-key
GOOGLE_SHEET_ID=your-google-sheet-id
```

### 2. Supabase Storage Setup
Run the SQL commands in `supabase-storage-setup.sql` in your Supabase SQL Editor to create the `user-documents` bucket with proper policies.

### 3. Google Sheets Setup
1. Create a Google Service Account
2. Download the service account JSON file
3. Extract `client_email` and `private_key` for environment variables
4. Create a Google Sheet and get its ID from the URL
5. Share the sheet with your service account email

## 📝 User Flow

### Step 1: Email & OTP Verification
- User enters their email and custom OTP
- System verifies against the `orientation_invites` table
- On success, advances to details form

### Step 2: Personal Details Submission
- User fills out personal information form
- Optional file uploads (Aadhaar and PAN card photos)
- Files are uploaded to Supabase Storage
- Form data is submitted to Google Sheets
- Invite status is updated to 'completed'

### Step 3: Content Display
- User sees personalized documents from `user_documents` table
- Documents are rendered using react-markdown
- Clean, readable format with step-by-step display
- Professional styling matching the website theme

## 🔗 URL Structure

Users access their onboarding at:
```
https://yoursite.com/onboarding/[invite-id]
```

Where `[invite-id]` is the UUID from the `orientation_invites` table.

## 🛡️ Security Features

- Server-side invite validation
- OTP verification with bcrypt hashing
- File upload to private Supabase bucket
- Service role authentication for admin operations
- Input validation and sanitization

## 📱 Responsive Design

The entire flow is fully responsive and works perfectly on:
- Desktop computers
- Tablets
- Mobile phones

## 🎯 Error Handling

- Invalid invite IDs return 404
- Already completed invites show completion message
- Network errors are gracefully handled
- File upload errors provide clear feedback
- Form validation prevents incomplete submissions

## 🚀 Testing

To test the flow:
1. Create an invite in the admin dashboard
2. Navigate to `/onboarding/[invite-id]`
3. Use the email and OTP from the invite
4. Fill out the details form
5. View the personalized content

The flow ensures a smooth, professional onboarding experience that matches your website's aesthetic and provides all necessary functionality for user onboarding.
