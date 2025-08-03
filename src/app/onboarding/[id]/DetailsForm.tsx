'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface Props {
  inviteId: string;
  onComplete: () => void;
}

interface FormData {
  name: string;
  personal_mail: string;
  phone_number: string;
  address: string;
  bank_account_number: string;
  aadhaar_photo: File | null;
  pan_card_photo: File | null;
}

export default function DetailsForm({ inviteId, onComplete }: Props) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    personal_mail: '',
    phone_number: '',
    address: '',
    bank_account_number: '',
    aadhaar_photo: null,
    pan_card_photo: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'aadhaar_photo' | 'pan_card_photo') => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const uploadFileToSupabase = async (file: File, fileName: string): Promise<string> => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Create a unique filename to avoid conflicts
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${inviteId}/${fileName}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('user-documents')
      .upload(uniqueFileName, file);

    if (error) {
      throw new Error(`Failed to upload ${fileName}: ${error.message}`);
    }

    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setUploadProgress('');

    try {
      let aadhaar_photo_path = '';
      let pan_card_photo_path = '';

      // Upload files if they exist
      if (formData.aadhaar_photo) {
        setUploadProgress('Uploading Aadhaar photo...');
        aadhaar_photo_path = await uploadFileToSupabase(formData.aadhaar_photo, 'aadhaar');
      }

      if (formData.pan_card_photo) {
        setUploadProgress('Uploading PAN card photo...');
        pan_card_photo_path = await uploadFileToSupabase(formData.pan_card_photo, 'pan_card');
      }

      setUploadProgress('Submitting details...');

      // Submit form data
      const response = await fetch('/api/orientation/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId,
          name: formData.name,
          personal_mail: formData.personal_mail,
          phone_number: formData.phone_number,
          address: formData.address,
          bank_account_number: formData.bank_account_number,
          aadhaar_photo_path,
          pan_card_photo_path,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onComplete();
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Submit Your Details
        </h2>
        <p className="text-gray-300 text-lg leading-relaxed max-w-2xl mx-auto">
          Please fill in all the required information to complete your onboarding with our AI platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {uploadProgress && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
              <span>{uploadProgress}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-200 mb-3">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="personal_mail" className="block text-sm font-semibold text-gray-200 mb-3">
              Personal Email *
            </label>
            <input
              type="email"
              id="personal_mail"
              name="personal_mail"
              value={formData.personal_mail}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
              placeholder="Enter your personal email"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-200 mb-3">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
              placeholder="Enter your phone number"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="bank_account_number" className="block text-sm font-semibold text-gray-200 mb-3">
              Bank Account Number *
            </label>
            <input
              type="text"
              id="bank_account_number"
              name="bank_account_number"
              value={formData.bank_account_number}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
              placeholder="Enter your bank account number"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-gray-200 mb-3">
            Address *
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm resize-none"
            placeholder="Enter your complete address"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="aadhaar_photo" className="block text-sm font-semibold text-gray-200 mb-3">
              Aadhaar Card Photo
            </label>
            <input
              type="file"
              id="aadhaar_photo"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'aadhaar_photo')}
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-blue-600 file:text-white hover:file:from-purple-700 hover:file:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="pan_card_photo" className="block text-sm font-semibold text-gray-200 mb-3">
              PAN Card Photo
            </label>
            <input
              type="file"
              id="pan_card_photo"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'pan_card_photo')}
              className="w-full px-4 py-4 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-600 file:to-blue-600 file:text-white hover:file:from-purple-700 hover:file:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.personal_mail || !formData.phone_number || !formData.address || !formData.bank_account_number}
          className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-red-500/25 disabled:shadow-none"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg">{uploadProgress || 'Submitting...'}</span>
            </div>
          ) : (
            <span className="text-lg">Submit Details</span>
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>* Required fields. All information will be securely stored and processed.</span>
        </div>
      </div>
    </div>
  );
}
