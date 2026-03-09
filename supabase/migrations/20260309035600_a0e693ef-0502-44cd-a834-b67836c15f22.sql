
ALTER TABLE public.cam_reports ADD CONSTRAINT cam_reports_application_id_unique UNIQUE (application_id);
ALTER TABLE public.workflow_status ADD CONSTRAINT workflow_status_application_id_unique UNIQUE (application_id);
