-- Add angelone_secret_key column to broker_settings
ALTER TABLE public.broker_settings ADD COLUMN IF NOT EXISTS angelone_secret_key TEXT;
