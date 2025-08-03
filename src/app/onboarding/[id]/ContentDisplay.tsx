'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
  inviteId: string;
}

interface Document {
  id: number;
  title: string;
  content: string;
  display_order: number;
  created_at: string;
}

// Function to convert plain URLs to markdown links and ensure proper line breaks
const preprocessMarkdown = (content: string): string => {
  // First, normalize line breaks and handle multiple spaces
  let processed = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // Convert URLs that aren't already in markdown format to clickable links
  // This regex finds URLs that aren't already wrapped in markdown link syntax
  processed = processed.replace(
    /(?<!\])\(?(https?:\/\/[^\s\)]+)\)?/g,
    (match, url) => {
      // Don't convert if it's already a markdown link
      if (match.startsWith('](') || processed.includes(`[`) && processed.includes(`](${url})`)) {
        return match;
      }
      return `[${url}](${url})`;
    }
  );

  // Ensure proper paragraph breaks by converting single line breaks to double line breaks
  // if they don't already exist
  processed = processed.replace(/([^\n])\n([^\n])/g, '$1\n\n$2');

  return processed;
};

export default function ContentDisplay({ inviteId }: Props) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/orientation/documents/${inviteId}`);
        const data = await response.json();

        if (response.ok) {
          setDocuments(data.documents);
        } else {
          setError(data.error || 'Failed to fetch documents');
        }
      } catch (error) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [inviteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 text-lg">Loading your personalized content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Error Loading Content</h3>
        <p className="text-red-300 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-red-500/25">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-4xl font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Onboarding Complete! 🎉
        </h2>
        <p className="text-gray-300 text-xl leading-relaxed max-w-3xl mx-auto">
          Your submission has been received and processed. Below are the important documents and information for your reference as you begin your journey with our AI platform.
        </p>
      </div>

      {/* Documents */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-800/30 border border-gray-600/50 rounded-xl p-8 backdrop-blur-sm">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-lg">No documents have been assigned to your onboarding yet.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {documents.map((document, index) => (
            <div
              key={document.id}
              className="bg-gray-800/30 border border-gray-600/50 rounded-xl p-8 hover:border-red-500/40 transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-red-500/10"
            >
              {/* Step Header */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mr-4 shadow-lg shadow-red-500/25">
                  <span className="text-white text-lg font-bold">{index + 1}</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Step {index + 1}: {document.title}
                </h3>
              </div>

              {/* Document Content */}
              <div className="prose prose-invert prose-purple max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-3xl font-bold text-white mb-6">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-semibold text-white mb-4">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-medium text-white mb-3">{children}</h3>,
                    p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed text-lg">{children}</p>,
                    ul: ({ children }) => <ul className="text-gray-300 mb-4 list-disc list-inside space-y-2 text-lg">{children}</ul>,
                    ol: ({ children }) => <ol className="text-gray-300 mb-4 list-decimal list-inside space-y-2 text-lg">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-red-300">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-gray-800 text-red-300 px-3 py-1 rounded-lg text-sm border border-gray-600/50">{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-800 text-red-300 p-6 rounded-xl overflow-x-auto text-sm mb-6 border border-gray-600/50 backdrop-blur-sm">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-red-500 pl-6 italic text-gray-300 mb-6 bg-gray-800/30 py-4 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        className="text-red-400 hover:text-red-300 underline transition-colors duration-200 hover:bg-red-400/10 px-1 py-0.5 rounded"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                        <svg className="inline w-3 h-3 ml-1 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ),
                  }}
                >
                  {preprocessMarkdown(document.content)}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-center">
        <div className="bg-gray-800/30 border border-gray-600/50 rounded-xl p-8 backdrop-blur-sm">
          <div className="mb-6">
            <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Need Help?
          </h3>
          <p className="text-gray-300 mb-6 text-lg leading-relaxed max-w-2xl mx-auto">
            If you have any questions or need assistance with your onboarding process, please don't hesitate to reach out to your administrator.
          </p>
          <div className="text-sm text-gray-400 bg-gray-700/30 rounded-lg px-6 py-3 inline-block">
            Thank you for completing your onboarding process with our AI platform!
          </div>
        </div>
      </div>
    </div>
  );
}
