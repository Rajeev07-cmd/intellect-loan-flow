ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS role text DEFAULT 'manager';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS notification_type text DEFAULT 'info';