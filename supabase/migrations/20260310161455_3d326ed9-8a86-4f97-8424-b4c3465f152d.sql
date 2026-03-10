
CREATE TABLE public.document_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  ai_predicted_type text NOT NULL DEFAULT 'Unknown',
  confidence_score numeric DEFAULT 0,
  user_decision text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.document_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read document_classifications" ON public.document_classifications FOR SELECT TO public USING (true);
CREATE POLICY "Public insert document_classifications" ON public.document_classifications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update document_classifications" ON public.document_classifications FOR UPDATE TO public USING (true);

CREATE TABLE public.swot_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  opportunities jsonb DEFAULT '[]'::jsonb,
  threats jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(application_id)
);

ALTER TABLE public.swot_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read swot_reports" ON public.swot_reports FOR SELECT TO public USING (true);
CREATE POLICY "Public insert swot_reports" ON public.swot_reports FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update swot_reports" ON public.swot_reports FOR UPDATE TO public USING (true);
