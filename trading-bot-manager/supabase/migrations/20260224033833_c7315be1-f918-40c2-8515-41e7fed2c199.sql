
ALTER TABLE public.strategies
  ADD COLUMN webhook_url_entry_buy text DEFAULT ''::text,
  ADD COLUMN webhook_url_entry_sell text DEFAULT ''::text,
  ADD COLUMN webhook_url_exit_buy text DEFAULT ''::text,
  ADD COLUMN webhook_url_exit_sell text DEFAULT ''::text;

-- Migrate existing webhook_url to all 4 new columns
UPDATE public.strategies
SET webhook_url_entry_buy = COALESCE(webhook_url, ''),
    webhook_url_entry_sell = COALESCE(webhook_url, ''),
    webhook_url_exit_buy = COALESCE(webhook_url, ''),
    webhook_url_exit_sell = COALESCE(webhook_url, '');
