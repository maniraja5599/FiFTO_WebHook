-- Create broker_settings table
CREATE TABLE IF NOT EXISTS public.broker_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    angelone_api_key TEXT,
    angelone_client_code TEXT,
    angelone_password TEXT,
    angelone_totp_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.broker_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own broker settings"
ON public.broker_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own broker settings"
ON public.broker_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own broker settings"
ON public.broker_settings FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_broker_settings_updated_at 
BEFORE UPDATE ON public.broker_settings 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
