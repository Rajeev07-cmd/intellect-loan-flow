
-- Drop existing restrictive policies on documents table
DROP POLICY IF EXISTS "Users can delete their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view all documents" ON public.documents;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can insert documents"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can select documents"
ON public.documents FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update documents"
ON public.documents FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete documents"
ON public.documents FOR DELETE TO authenticated
USING (true);

-- Also allow anon read access for public viewing
CREATE POLICY "Anon users can view documents"
ON public.documents FOR SELECT TO anon
USING (true);

-- Fix storage RLS: allow authenticated uploads to documents bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Allow public reads on documents"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents');
