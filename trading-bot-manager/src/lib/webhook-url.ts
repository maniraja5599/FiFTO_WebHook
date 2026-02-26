const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export function getWebhookUrl(token: string) {
  return `https://${PROJECT_ID}.supabase.co/functions/v1/webhook-receiver?token=${token}`;
}
