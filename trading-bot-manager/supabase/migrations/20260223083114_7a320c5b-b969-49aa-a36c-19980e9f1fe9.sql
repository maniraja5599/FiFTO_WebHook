
-- Create signal_type enum
CREATE TYPE public.signal_type AS ENUM ('entry_buy', 'entry_sell', 'exit_buy', 'exit_sell');

-- Create signal_source enum
CREATE TYPE public.signal_source AS ENUM ('webhook', 'manual');

-- Create signal_status enum
CREATE TYPE public.signal_status AS ENUM ('pending', 'forwarded', 'failed');

-- Create strategies table
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT DEFAULT '',
  webhook_url TEXT DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  entry_buy_token UUID NOT NULL DEFAULT gen_random_uuid(),
  entry_sell_token UUID NOT NULL DEFAULT gen_random_uuid(),
  exit_buy_token UUID NOT NULL DEFAULT gen_random_uuid(),
  exit_sell_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create signals table
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id UUID NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  signal_type public.signal_type NOT NULL,
  source public.signal_source NOT NULL DEFAULT 'webhook',
  price NUMERIC,
  quantity NUMERIC,
  notes TEXT DEFAULT '',
  status public.signal_status NOT NULL DEFAULT 'pending',
  response_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Strategies RLS: owner only
CREATE POLICY "Users can view own strategies" ON public.strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own strategies" ON public.strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strategies" ON public.strategies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strategies" ON public.strategies FOR DELETE USING (auth.uid() = user_id);

-- Signals RLS: owner via strategy
CREATE POLICY "Users can view own signals" ON public.signals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.strategies s WHERE s.id = signals.strategy_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can create own signals" ON public.signals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.strategies s WHERE s.id = signals.strategy_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can update own signals" ON public.signals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.strategies s WHERE s.id = signals.strategy_id AND s.user_id = auth.uid())
);
CREATE POLICY "Users can delete own signals" ON public.signals FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.strategies s WHERE s.id = signals.strategy_id AND s.user_id = auth.uid())
);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_signals_strategy_id ON public.signals(strategy_id);
CREATE INDEX idx_signals_created_at ON public.signals(created_at DESC);
CREATE INDEX idx_strategies_user_id ON public.strategies(user_id);
