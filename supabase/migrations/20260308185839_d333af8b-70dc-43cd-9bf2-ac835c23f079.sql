
-- Fix all RESTRICTIVE RLS policies to PERMISSIVE

-- APPLICATIONS
DROP POLICY IF EXISTS "Users can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can update applications" ON public.applications;

CREATE POLICY "Public read applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "Public insert applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update applications" ON public.applications FOR UPDATE USING (true);

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Anyone can view audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit_logs" ON public.audit_logs;

CREATE POLICY "Public read audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Public insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- CAM_REPORTS
DROP POLICY IF EXISTS "Allow select cam_reports" ON public.cam_reports;
DROP POLICY IF EXISTS "Anon select cam_reports" ON public.cam_reports;
DROP POLICY IF EXISTS "Anyone can insert cam_reports" ON public.cam_reports;
DROP POLICY IF EXISTS "Anyone can update cam_reports" ON public.cam_reports;

CREATE POLICY "Public read cam_reports" ON public.cam_reports FOR SELECT USING (true);
CREATE POLICY "Public insert cam_reports" ON public.cam_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cam_reports" ON public.cam_reports FOR UPDATE USING (true);

-- DOCUMENTS
DROP POLICY IF EXISTS "Authenticated users can select documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON public.documents;
DROP POLICY IF EXISTS "Anon users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can insert documents" ON public.documents;

CREATE POLICY "Public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Public delete documents" ON public.documents FOR DELETE USING (true);

-- FINANCIAL_FEATURES
DROP POLICY IF EXISTS "Allow select financial_features" ON public.financial_features;
DROP POLICY IF EXISTS "Anon select financial_features" ON public.financial_features;
DROP POLICY IF EXISTS "Anyone can insert financial_features" ON public.financial_features;
DROP POLICY IF EXISTS "Anyone can update financial_features" ON public.financial_features;

CREATE POLICY "Public read financial_features" ON public.financial_features FOR SELECT USING (true);
CREATE POLICY "Public insert financial_features" ON public.financial_features FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update financial_features" ON public.financial_features FOR UPDATE USING (true);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can update notifications" ON public.notifications;

CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update notifications" ON public.notifications FOR UPDATE USING (true);

-- RISK_RESULTS
DROP POLICY IF EXISTS "Allow select risk_results" ON public.risk_results;
DROP POLICY IF EXISTS "Anon select risk_results" ON public.risk_results;
DROP POLICY IF EXISTS "Anyone can insert risk_results" ON public.risk_results;
DROP POLICY IF EXISTS "Anyone can update risk_results" ON public.risk_results;

CREATE POLICY "Public read risk_results" ON public.risk_results FOR SELECT USING (true);
CREATE POLICY "Public insert risk_results" ON public.risk_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update risk_results" ON public.risk_results FOR UPDATE USING (true);

-- WORKFLOW_STATUS
DROP POLICY IF EXISTS "Allow select workflow_status" ON public.workflow_status;
DROP POLICY IF EXISTS "Anon select workflow_status" ON public.workflow_status;
DROP POLICY IF EXISTS "Anyone can insert workflow_status" ON public.workflow_status;
DROP POLICY IF EXISTS "Anyone can update workflow_status" ON public.workflow_status;

CREATE POLICY "Public read workflow_status" ON public.workflow_status FOR SELECT USING (true);
CREATE POLICY "Public insert workflow_status" ON public.workflow_status FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update workflow_status" ON public.workflow_status FOR UPDATE USING (true);

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
