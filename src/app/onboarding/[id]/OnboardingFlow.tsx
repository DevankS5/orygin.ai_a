'use client';

import { useState } from 'react';
import OtpForm from './OtpForm';
import DetailsForm from './DetailsForm';
import ContentDisplay from './ContentDisplay';

interface Props {
  inviteId: string;
  userName: string;
}

type FlowStep = 'otp' | 'details' | 'content';

export default function OnboardingFlow({ inviteId, userName }: Props) {
  const [step, setStep] = useState<FlowStep>('otp');
  const [isVerified, setIsVerified] = useState(false);

  const handleOtpSuccess = () => {
    setIsVerified(true);
    setStep('details');
  };

  const handleDetailsComplete = () => {
    setStep('content');
  };

  return (
    <div className="w-full">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-12">
        <div className="flex items-center space-x-6">
          {/* Step 1 - OTP */}
          <div className={`flex items-center ${step !== 'otp' ? 'text-red-400' : 'text-red-500'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              step !== 'otp' 
                ? 'bg-gradient-to-r from-red-600 to-red-500 border-red-400 shadow-lg shadow-red-500/25' 
                : 'border-red-500 bg-red-500/10 backdrop-blur-sm'
            }`}>
              {step !== 'otp' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-lg font-bold text-white">1</span>
              )}
            </div>
            <span className="ml-3 font-semibold text-lg">Verify Identity</span>
          </div>

          {/* Connector */}
          <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
            step === 'otp' ? 'bg-gray-600' : 'bg-gradient-to-r from-red-600 to-red-500'
          }`}></div>

          {/* Step 2 - Details */}
          <div className={`flex items-center ${
            step === 'otp' ? 'text-gray-500' : 
            step === 'details' ? 'text-red-500' : 'text-red-400'
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              step === 'content' 
                ? 'bg-gradient-to-r from-red-600 to-red-500 border-red-400 shadow-lg shadow-red-500/25' :
              step === 'details' 
                ? 'border-red-500 bg-red-500/10 backdrop-blur-sm' 
                : 'border-gray-600 bg-gray-700/50'
            }`}>
              {step === 'content' ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-lg font-bold text-white">2</span>
              )}
            </div>
            <span className="ml-3 font-semibold text-lg">Submit Details</span>
          </div>

          {/* Connector */}
          <div className={`w-16 h-1 rounded-full transition-all duration-500 ${
            step === 'content' ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gray-600'
          }`}></div>

          {/* Step 3 - Content */}
          <div className={`flex items-center ${step === 'content' ? 'text-red-500' : 'text-gray-500'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              step === 'content' ? 'border-red-500 bg-red-500/10 backdrop-blur-sm' : 'border-gray-600 bg-gray-700/50'
            }`}>
              <span className="text-lg font-bold text-white">3</span>
            </div>
            <span className="ml-3 font-semibold text-lg">View Content</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
        {step === 'otp' && (
          <OtpForm inviteId={inviteId} userName={userName} onSuccess={handleOtpSuccess} />
        )}
        
        {step === 'details' && (
          <DetailsForm inviteId={inviteId} onComplete={handleDetailsComplete} />
        )}
        
        {step === 'content' && (
          <ContentDisplay inviteId={inviteId} />
        )}
      </div>
    </div>
  );
}
