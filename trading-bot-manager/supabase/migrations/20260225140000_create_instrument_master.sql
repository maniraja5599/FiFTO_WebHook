
-- Create instrument_master table
CREATE TABLE IF NOT EXISTS public.instrument_master (
    token TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    expiry TEXT,
    lotsize TEXT,
    exch_seg TEXT NOT NULL,
    instrumenttype TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.instrument_master ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read
CREATE POLICY "Allow public read access" ON public.instrument_master
    FOR SELECT USING (true);

-- Create policy to allow service role / authenticated users to update (for sync script)
CREATE POLICY "Allow authenticated upsert" ON public.instrument_master
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
