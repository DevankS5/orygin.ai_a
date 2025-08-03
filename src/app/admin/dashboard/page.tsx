'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface Invite {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface Document {
  id: number;
  invite_id: string;
  title: string;
  content: string;
  display_order: number;
  created_at: string;
}

interface InviteFormData {
  name: string;
  email: string;
  otp: string;
}

interface DocumentFormData {
  title: string;
  content: string;
  display_order: number;
}

interface EmailFormData {
  to: string;
  subject: string;
  htmlContent: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Invites state
  const [invites, setInvites] = useState<Invite[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [invitesLoading, setInvitesLoading] = useState(true);
  
  // Create invite form state
  const [inviteForm, setInviteForm] = useState<InviteFormData>({ name: '', email: '', otp: '' });
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // Document form state
  const [documentForm, setDocumentForm] = useState<DocumentFormData>({ 
    title: '', 
    content: '', 
    display_order: 0 
  });
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentSuccess, setDocumentSuccess] = useState<string | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  // Fetch all invites on page load
  useEffect(() => {
    if (isAuthenticated) {
      fetchInvites();
    }
  }, [isAuthenticated]);

  // Fetch documents when an invite is selected
  useEffect(() => {
    if (selectedInvite) {
      fetchDocuments(selectedInvite.id);
    }
  }, [selectedInvite]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error during logout:', error);
      }
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/admin/login');
    }
  };

  const checkAuthentication = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setIsAuthenticated(false);
        router.push('/admin/login');
        return;
      }

      if (!session) {
        setIsAuthenticated(false);
        router.push('/admin/login');
        return;
      }

      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      router.push('/admin/login');
    }
  };

  const fetchInvites = async () => {
    try {
      setInvitesLoading(true);
      setInviteError('');
      
      const response = await fetch('/api/admin/invites', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setInvites(data.invites);
      } else {
        console.error('Failed to fetch invites:', data.error);
        setInviteError(`Failed to fetch invites: ${data.details || data.error}`);
      }
    } catch (error) {
      console.error('Error fetching invites:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setInviteError(`Network error while fetching invites: ${errorMessage}`);
    } finally {
      setInvitesLoading(false);
    }
  };

  const fetchDocuments = async (inviteId: string) => {
    try {
      setDocumentsLoading(true);
      const response = await fetch(`/api/admin/documents/${inviteId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
      } else {
        console.error('Failed to fetch documents:', data.error);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteSubmitting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const response = await fetch('/api/admin/invites/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteSuccess('Invite created successfully!');
        setInviteForm({ name: '', email: '', otp: '' }); // Reset form
        fetchInvites(); // Refresh the list
      } else {
        setInviteError(data.error || 'Failed to create invite');
      }
    } catch (error) {
      setInviteError('Network error occurred');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string, inviteName: string) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the invite for "${inviteName}"? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return; // User cancelled
    }

    try {
      const response = await fetch('/api/admin/invites/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      });

      const data = await response.json();

      if (response.ok) {
        setInviteSuccess(`Invite for ${inviteName} deleted successfully!`);
        
        // Clear selection if the deleted invite was selected
        if (selectedInvite?.id === inviteId) {
          setSelectedInvite(null);
          setDocuments([]);
        }
        
        // Refresh the list
        fetchInvites();
      } else {
        setInviteError(data.error || 'Failed to delete invite');
      }
    } catch (error) {
      setInviteError('Network error occurred while deleting');
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvite) return;

    setDocumentSubmitting(true);
    setDocumentError(null);
    setDocumentSuccess(null);

    try {
      const response = await fetch('/api/admin/documents/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...documentForm,
          invite_id: selectedInvite.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDocumentSuccess('Document created successfully!');
        setDocumentForm({ title: '', content: '', display_order: 0 }); // Reset form
        fetchDocuments(selectedInvite.id); // Refresh documents
      } else {
        setDocumentError(data.error || 'Failed to create document');
      }
    } catch (error) {
      setDocumentError('Network error occurred');
    } finally {
      setDocumentSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId: number, documentTitle: string) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the document "${documentTitle}"? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return; // User cancelled
    }

    try {
      const response = await fetch('/api/admin/documents/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      const data = await response.json();

      if (response.ok) {
        setDocumentSuccess(`Document "${documentTitle}" deleted successfully!`);
        
        // Refresh the documents list
        if (selectedInvite) {
          fetchDocuments(selectedInvite.id);
        }
      } else {
        setDocumentError(data.error || 'Failed to delete document');
      }
    } catch (error) {
      setDocumentError('Network error occurred while deleting document');
    }
  };

  const handleInviteClick = (invite: Invite) => {
    setSelectedInvite(invite);
    setDocumentError(null);
    setDocumentSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Invites */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Invites</h2>
              
              {/* Create New Invite Form */}
              <form onSubmit={handleCreateInvite} className="space-y-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900">Create New Invite</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-gray-900 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    placeholder="Enter participant's name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    placeholder="Enter participant's email"
                  />
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-bold text-gray-900 mb-1">
                    Custom OTP
                  </label>
                  <input
                    type="text"
                    id="otp"
                    value={inviteForm.otp}
                    onChange={(e) => setInviteForm({ ...inviteForm, otp: e.target.value })}
                    required
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white font-medium"
                    placeholder="Enter custom OTP"
                  />
                </div>

                <button
                  type="submit"
                  disabled={inviteSubmitting}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviteSubmitting ? 'Creating...' : 'Create Invite'}
                </button>

                {/* Success/Error Messages for Invite */}
                {inviteSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">{inviteSuccess}</p>
                  </div>
                )}
                {inviteError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{inviteError}</p>
                  </div>
                )}
              </form>
            </div>

            {/* Invites List */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">All Invites</h3>
              
              {invitesLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-700 font-medium">Loading invites...</p>
                </div>
              ) : inviteError ? (
                <div className="text-center py-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 font-medium">Error loading invites:</p>
                    <p className="text-red-700 text-sm mt-1">{inviteError}</p>
                  </div>
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-700 font-medium">No invites created yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className={`p-4 border rounded-md transition-colors ${
                        selectedInvite?.id === invite.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div 
                          onClick={() => handleInviteClick(invite)}
                          className="cursor-pointer flex-1 hover:bg-gray-50 p-2 -m-2 rounded"
                        >
                          <h4 className="font-bold text-gray-900 text-base">{invite.name}</h4>
                          <p className="text-sm text-gray-800 font-medium">{invite.email}</p>
                          <p className="text-xs text-gray-700 mt-1 font-medium">
                            Created: {invite.created_at ? new Date(invite.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invite.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {invite.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInvite(invite.id, invite.name);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded text-xs font-medium transition-colors"
                            title={`Delete invite for ${invite.name}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              {selectedInvite ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Details</h2>
                  
                  {/* Selected Invite Details */}
                  <div className="bg-gray-50 p-4 rounded-md mb-6">
                    <h3 className="font-medium text-gray-900 mb-2">Selected Invite</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Name:</strong> {selectedInvite.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Email:</strong> {selectedInvite.email}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Unique Link:</strong>
                    </p>
                    <div className="bg-white p-2 rounded border font-mono text-xs break-all">
                      https://orygin.io/onboarding/{selectedInvite.id}
                    </div>
                  </div>

                  {/* Manage Documents Section */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Documents</h3>
                    
                    {/* Add Document Form */}
                    <form onSubmit={handleCreateDocument} className="space-y-4 mb-6">
                      <div>
                        <label htmlFor="doc-title" className="block text-sm font-bold text-gray-900 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="doc-title"
                          value={documentForm.title}
                          onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                          required
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white font-medium"
                          placeholder="Enter document title"
                        />
                      </div>

                      <div>
                        <label htmlFor="doc-content" className="block text-sm font-bold text-gray-900 mb-1">
                          Content
                        </label>
                        <textarea
                          id="doc-content"
                          value={documentForm.content}
                          onChange={(e) => setDocumentForm({ ...documentForm, content: e.target.value })}
                          required
                          rows={6}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white font-medium"
                          placeholder="Enter document content"
                        />
                      </div>

                      <div>
                        <label htmlFor="doc-order" className="block text-sm font-bold text-gray-900 mb-1">
                          Display Order
                        </label>
                        <input
                          type="number"
                          id="doc-order"
                          value={documentForm.display_order}
                          onChange={(e) => setDocumentForm({ ...documentForm, display_order: parseInt(e.target.value) || 0 })}
                          min="0"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white font-medium"
                          placeholder="Enter display order"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={documentSubmitting}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {documentSubmitting ? 'Adding...' : 'Add Document'}
                      </button>

                      {/* Success/Error Messages for Document */}
                      {documentSuccess && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700">{documentSuccess}</p>
                        </div>
                      )}
                      {documentError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">{documentError}</p>
                        </div>
                      )}
                    </form>

                    {/* Documents List */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Existing Documents</h4>
                      
                      {documentsLoading ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500">Loading documents...</p>
                        </div>
                      ) : documents.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-500">No documents added yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <div key={doc.id} className="p-3 border border-gray-200 rounded-md">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{doc.title}</h5>
                                  <span className="text-xs text-gray-500">Order: {doc.display_order}</span>
                                </div>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors ml-2"
                                  title={`Delete document "${doc.title}"`}
                                >
                                  Delete
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-3">{doc.content}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Created: {new Date(doc.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Invite Selected</h3>
                  <p className="text-gray-500">Click on an invite from the left panel to view details and manage documents.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Composer Section */}
        <SingleEmailComposer />
      </div>
    </div>
  );
}

// SingleEmailComposer Component
function SingleEmailComposer() {
  const [emailForm, setEmailForm] = useState<EmailFormData>({
    to: '',
    subject: '',
    htmlContent: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/send-single-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailForm.to.trim(),
          subject: emailForm.subject.trim(),
          htmlContent: emailForm.htmlContent,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Email sent successfully to ${emailForm.to}`);
        setEmailForm({ to: '', subject: '', htmlContent: '' }); // Reset form
      } else {
        setError(data.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Network error occurred while sending email');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof EmailFormData, value: string) => {
    setEmailForm(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (success) setSuccess(null);
    if (error) setError(null);
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Compose Email</h2>
        <p className="text-sm text-gray-600 mb-6">
          Send a custom email to any recipient using your Spacemail account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Email */}
          <div>
            <label htmlFor="email-to" className="block text-sm font-bold text-gray-900 mb-1">
              To: <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email-to"
              value={emailForm.to}
              onChange={(e) => handleInputChange('to', e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white font-medium"
              placeholder="recipient@example.com"
              disabled={isSubmitting}
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="email-subject" className="block text-sm font-bold text-gray-900 mb-1">
              Subject: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="email-subject"
              value={emailForm.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white font-medium"
              placeholder="Enter email subject"
              disabled={isSubmitting}
            />
          </div>

          {/* Email Body */}
          <div>
            <label htmlFor="email-body" className="block text-sm font-bold text-gray-900 mb-1">
              Email Body: <span className="text-red-500">*</span>
            </label>
            <div className="text-xs text-gray-500 mb-2">
              You can use HTML formatting for rich content.
            </div>
            <textarea
              id="email-body"
              value={emailForm.htmlContent}
              onChange={(e) => handleInputChange('htmlContent', e.target.value)}
              required
              rows={12}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white font-medium resize-vertical"
              placeholder="Enter your email content here. You can use HTML tags for formatting."
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !emailForm.to.trim() || !emailForm.subject.trim() || !emailForm.htmlContent.trim()}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-md transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending Email...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Send Email</span>
              </div>
            )}
          </button>

          {/* Success/Error Messages */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
