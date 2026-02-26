import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find strategy by token - check all 4 token columns
    const tokenColumns = ["entry_buy_token", "entry_sell_token", "exit_buy_token", "exit_sell_token"];
    const signalTypeMap: Record<string, string> = {
      entry_buy_token: "entry_buy",
      entry_sell_token: "entry_sell",
      exit_buy_token: "exit_buy",
      exit_sell_token: "exit_sell",
    };

    let strategy: any = null;
    let signalType = "";

    for (const col of tokenColumns) {
      const { data } = await supabase
        .from("strategies")
        .select("*")
        .eq(col, token)
        .eq("enabled", true)
        .maybeSingle();

      if (data) {
        strategy = data;
        signalType = signalTypeMap[col];
        break;
      }
    }

    if (!strategy) {
      return new Response(JSON.stringify({ error: "Invalid token or strategy disabled" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse body if any
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // no body or not JSON
    }

    const price = body.price || null;
    const quantity = body.quantity || null;
    const notes = body.notes || body.message || "";

    // Determine the forward webhook URL for this signal type
    const webhookUrlMap: Record<string, string> = {
      entry_buy: strategy.webhook_url_entry_buy || strategy.webhook_url || "",
      entry_sell: strategy.webhook_url_entry_sell || strategy.webhook_url || "",
      exit_buy: strategy.webhook_url_exit_buy || strategy.webhook_url || "",
      exit_sell: strategy.webhook_url_exit_sell || strategy.webhook_url || "",
    };
    const forwardUrl = webhookUrlMap[signalType] || "";

    // Forward to configured webhook URL
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
            signal_type: signalType,
            price,
            quantity,
            notes,
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

    // Log signal
    const { error: insertError } = await supabase.from("signals").insert({
      strategy_id: strategy.id,
      signal_type: signalType,
      source: "webhook",
      price,
      quantity,
      notes,
      status,
      response_code: responseCode,
      response_body: responseBody,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
    }

    return new Response(
      JSON.stringify({ success: true, signal_type: signalType, status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
