
-- AML Results table
CREATE TABLE public.aml_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  aml_risk_score integer DEFAULT 0,
  aml_risk_level text DEFAULT 'Low',
  sanction_match boolean DEFAULT false,
  pep_detected boolean DEFAULT false,
  fraud_history boolean DEFAULT false,
  flags jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.aml_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read aml_results" ON public.aml_results FOR SELECT TO public USING (true);
CREATE POLICY "Public insert aml_results" ON public.aml_results FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update aml_results" ON public.aml_results FOR UPDATE TO public USING (true);

-- Sanction list table
CREATE TABLE public.sanction_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text,
  director_name text,
  country text,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.sanction_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sanction_list" ON public.sanction_list FOR SELECT TO public USING (true);
CREATE POLICY "Public insert sanction_list" ON public.sanction_list FOR INSERT TO public WITH CHECK (true);

-- PEP database table
CREATE TABLE public.pep_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name text NOT NULL,
  position text,
  country text,
  risk_level text DEFAULT 'Medium',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.pep_database ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pep_database" ON public.pep_database FOR SELECT TO public USING (true);
CREATE POLICY "Public insert pep_database" ON public.pep_database FOR INSERT TO public WITH CHECK (true);
