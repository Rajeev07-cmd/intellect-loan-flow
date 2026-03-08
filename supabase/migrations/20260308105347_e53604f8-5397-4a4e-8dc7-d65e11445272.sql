-- Applications table for loan applications
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  cin TEXT,
  sector TEXT NOT NULL,
  loan_amount DECIMAL(15, 2) NOT NULL,
  business_description TEXT,
  registered_address TEXT,
  contact_person TEXT,
  incorporation_year TEXT,
  promoter_group TEXT,
  cibil_score INTEGER DEFAULT 700,
  risk_score INTEGER DEFAULT 50,
  risk_category TEXT DEFAULT 'Medium',
  default_probability DECIMAL(5, 4) DEFAULT 0.25,
  status TEXT NOT NULL DEFAULT 'Application Created',
  recommendation TEXT DEFAULT 'Under Review',
  interest_rate TEXT DEFAULT '11.5%',
  suggested_limit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table for uploaded files
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
CREATE POLICY "Users can view all applications" 
  ON public.applications FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create applications" 
  ON public.applications FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their applications" 
  ON public.applications FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view all documents" 
  ON public.documents FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can upload documents" 
  ON public.documents FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their documents" 
  ON public.documents FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their documents" 
  ON public.documents FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  true,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Anyone can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Users can delete their documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');