-- Create a storage bucket for user documents (Run this in Supabase SQL Editor)

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false);

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to view their own files
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-documents' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow admins to view all files (using service role)
CREATE POLICY "Service role can access all documents" ON storage.objects
FOR ALL USING (
  bucket_id = 'user-documents' AND
  auth.role() = 'service_role'
);
