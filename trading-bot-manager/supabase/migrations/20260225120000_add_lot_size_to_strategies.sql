-- Add columns for lot size and Angel One integration to strategies table
ALTER TABLE public.strategies 
ADD COLUMN IF NOT EXISTS lot_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS lot_deploy_qty INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS angelone_token TEXT,
ADD COLUMN IF NOT EXISTS exchange TEXT DEFAULT 'NFO';

-- Add comment to explain columns
COMMENT ON COLUMN public.strategies.lot_size IS 'Lot size of the instrument (e.g. 50 for NIFTY)';
COMMENT ON COLUMN public.strategies.lot_deploy_qty IS 'Number of lots to deploy for this strategy';
COMMENT ON COLUMN public.strategies.angelone_token IS 'Angel One instrument token for LTP fetching';
COMMENT ON COLUMN public.strategies.exchange IS 'Exchange segment (NSE, NFO, MCX, etc.)';
