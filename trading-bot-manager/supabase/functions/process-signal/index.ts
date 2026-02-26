import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { strategy_id, signal_type, price, quantity, notes } = body;

    if (!strategy_id || !signal_type) {
      return new Response(JSON.stringify({ error: "Missing strategy_id or signal_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify strategy ownership and get webhook URL
    const { data: strategy, error: stratError } = await supabase
      .from("strategies")
      .select("*")
      .eq("id", strategy_id)
      .single();

    if (stratError || !strategy) {
      return new Response(JSON.stringify({ error: "Strategy not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine the forward webhook URL for this signal type
    const webhookUrlMap: Record<string, string> = {
      entry_buy: strategy.webhook_url_entry_buy || strategy.webhook_url || "",
      entry_sell: strategy.webhook_url_entry_sell || strategy.webhook_url || "",
      exit_buy: strategy.webhook_url_exit_buy || strategy.webhook_url || "",
      exit_sell: strategy.webhook_url_exit_sell || strategy.webhook_url || "",
    };
    const forwardUrl = webhookUrlMap[signal_type] || "";

    // Forward to webhook URL
    let status = "forwarded";
    let responseCode: number | null = null;
    let responseBody = "";

    if (forwardUrl) {
      try {
        const fwdRes = await fetch(forwardUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategy: strategy.name,
            symbol: strategy.symbol,
            signal_type,
            price: price || null,
            quantity: quantity || null,
            notes: notes || "",
            source: "manual",
            timestamp: new Date().toISOString(),
          }),
        });
        responseCode = fwdRes.status;
        responseBody = await fwdRes.text();
        if (!fwdRes.ok) status = "failed";
      } catch (e) {
        status = "failed";
        responseBody = e.message;
      }
    }

    // Use service role to insert signal (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: insertError } = await serviceClient.from("signals").insert({
      strategy_id,
      signal_type,
      source: "manual",
      price: price || null,
      quantity: quantity || null,
      notes: notes || "",
      status,
      response_code: responseCode,
      response_body: responseBody,
    });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
