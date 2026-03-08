
CREATE TABLE public.document_extracted_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  page_number INTEGER DEFAULT 1,
  coordinates JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0,
  is_manually_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_extracted_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read document_extracted_fields" ON public.document_extracted_fields FOR SELECT USING (true);
CREATE POLICY "Public insert document_extracted_fields" ON public.document_extracted_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update document_extracted_fields" ON public.document_extracted_fields FOR UPDATE USING (true);
