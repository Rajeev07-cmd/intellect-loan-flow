
-- Fix applications insert policy to allow anyone
DROP POLICY IF EXISTS "Users can create applications" ON public.applications;
CREATE POLICY "Anyone can insert applications"
ON public.applications FOR INSERT
WITH CHECK (true);

-- Also allow updates for workflow
DROP POLICY IF EXISTS "Users can update their applications" ON public.applications;
CREATE POLICY "Anyone can update applications"
ON public.applications FOR UPDATE
USING (true);

-- Allow anon insert into workflow_status, financial_features, risk_results, cam_reports
DROP POLICY IF EXISTS "Allow insert financial_features" ON public.financial_features;
CREATE POLICY "Anyone can insert financial_features"
ON public.financial_features FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert risk_results" ON public.risk_results;
CREATE POLICY "Anyone can insert risk_results"
ON public.risk_results FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert cam_reports" ON public.cam_reports;
CREATE POLICY "Anyone can insert cam_reports"
ON public.cam_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert workflow_status" ON public.workflow_status;
CREATE POLICY "Anyone can insert workflow_status"
ON public.workflow_status FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update financial_features" ON public.financial_features;
CREATE POLICY "Anyone can update financial_features"
ON public.financial_features FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow update risk_results" ON public.risk_results;
CREATE POLICY "Anyone can update risk_results"
ON public.risk_results FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow update cam_reports" ON public.cam_reports;
CREATE POLICY "Anyone can update cam_reports"
ON public.cam_reports FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow update workflow_status" ON public.workflow_status;
CREATE POLICY "Anyone can update workflow_status"
ON public.workflow_status FOR UPDATE USING (true);
