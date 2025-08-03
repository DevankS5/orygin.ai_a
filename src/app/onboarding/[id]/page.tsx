import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import OnboardingFlow from './OnboardingFlow';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OnboardingPage({ params }: Props) {
  // Await the params since they're now a Promise in Next.js 15
  const { id } = await params;
  
  // Create Supabase client with service role for server-side data fetching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch the invite details
  const { data: invite, error } = await supabase
    .from('orientation_invites')
    .select('id, name, email, status, created_at')
    .eq('id', id)
    .single();

  // Handle not found case
  if (error || !invite) {
    console.error('Invite not found:', id, error);
    notFound();
  }

  // Handle already completed case
  if (invite.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-8 text-center shadow-2xl">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Onboarding Complete
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              Hi <span className="font-semibold text-red-400">{invite.name}</span>, this onboarding link has already been used and your submission has been completed successfully.
            </p>
          </div>
          <div className="text-sm text-gray-400 bg-gray-700/30 rounded-xl p-4">
            <span className="font-medium">Completed on:</span> {new Date(invite.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  // Render the main onboarding flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600/20 to-red-500/20 border border-red-500/30 rounded-full text-sm text-red-300 font-medium mb-6">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Welcome to Orygin AI
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Hi, <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">{invite.name}</span>! 
              <span className="block mt-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-lg rotate-45 mx-auto flex items-center justify-center shadow-lg shadow-red-500/25">
                  <svg className="w-8 h-8 text-white -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Welcome to your personalized onboarding experience. Let's get you set up with our AI-powered platform.
            </p>
          </div>

          {/* Main Onboarding Flow */}
          <OnboardingFlow inviteId={id} userName={invite.name} />
        </div>
      </div>
    </div>
  );
}