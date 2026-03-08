
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS credit_officer_decision text,
ADD COLUMN IF NOT EXISTS manager_decision text,
ADD COLUMN IF NOT EXISTS final_status text;
