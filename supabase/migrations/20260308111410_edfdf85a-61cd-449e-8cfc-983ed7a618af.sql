
-- Create financial_features table
CREATE TABLE public.financial_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  profit_margin NUMERIC,
  debt_ratio NUMERIC,
  interest_coverage_ratio NUMERIC,
  revenue_growth NUMERIC,
  sector_risk NUMERIC,
  collateral_score NUMERIC,
  litigation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_results table
CREATE TABLE public.risk_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  risk_score INTEGER,
  risk_category TEXT,
  default_probability NUMERIC,
  explanation JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cam_reports table
CREATE TABLE public.cam_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  company_overview TEXT,
  financial_analysis TEXT,
  risk_analysis TEXT,
  recommendation TEXT,
  suggested_loan_limit TEXT,
  interest_rate TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workflow_status table
CREATE TABLE public.workflow_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  current_stage TEXT NOT NULL DEFAULT 'Application Created',
  stage_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.financial_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_status ENABLE ROW LEVEL SECURITY;

-- Financial Features Policies
CREATE POLICY "Allow select financial_features" ON public.financial_features
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert financial_features" ON public.financial_features
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update financial_features" ON public.financial_features
FOR UPDATE TO authenticated USING (true);

-- Risk Results Policies
CREATE POLICY "Allow select risk_results" ON public.risk_results
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert risk_results" ON public.risk_results
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update risk_results" ON public.risk_results
FOR UPDATE TO authenticated USING (true);

-- CAM Reports Policies
CREATE POLICY "Allow select cam_reports" ON public.cam_reports
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert cam_reports" ON public.cam_reports
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update cam_reports" ON public.cam_reports
FOR UPDATE TO authenticated USING (true);

-- Workflow Status Policies
CREATE POLICY "Allow select workflow_status" ON public.workflow_status
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert workflow_status" ON public.workflow_status
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update workflow_status" ON public.workflow_status
FOR UPDATE TO authenticated USING (true);

-- Allow anon read access for demo purposes
CREATE POLICY "Anon select financial_features" ON public.financial_features
FOR SELECT TO anon USING (true);

CREATE POLICY "Anon select risk_results" ON public.risk_results
FOR SELECT TO anon USING (true);

CREATE POLICY "Anon select cam_reports" ON public.cam_reports
FOR SELECT TO anon USING (true);

CREATE POLICY "Anon select workflow_status" ON public.workflow_status
FOR SELECT TO anon USING (true);

-- Enable realtime for workflow tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_results;
