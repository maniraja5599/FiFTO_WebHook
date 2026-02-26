import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Signal = {
  id: string;
  strategy_id: string;
  signal_type: "entry_buy" | "entry_sell" | "exit_buy" | "exit_sell";
  source: "webhook" | "manual";
  price: number | null;
  quantity: number | null;
  notes: string;
  status: "pending" | "forwarded" | "failed";
  response_code: number | null;
  response_body: string | null;
  created_at: string;
  updated_at: string;
};

export function useSignals(filters?: {
  strategyId?: string;
  signalType?: string;
  source?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["signals", filters],
    queryFn: async () => {
      let query = supabase
        .from("signals")
        .select("*, strategies(name, symbol)")
        .order("created_at", { ascending: false });

      if (filters?.strategyId) query = query.eq("strategy_id", filters.strategyId);
      if (filters?.signalType) query = query.eq("signal_type", filters.signalType as any);
      if (filters?.source) query = query.eq("source", filters.source as any);
      if (filters?.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;
      return data as (Signal & { strategies: { name: string; symbol: string } })[];
    },
  });
}

export function useFireSignal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      strategy_id: string;
      signal_type: "entry_buy" | "entry_sell" | "exit_buy" | "exit_sell";
      price?: number;
      quantity?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("process-signal", {
        body: { ...payload, source: "manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["signals"] });
      qc.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Signal fired successfully");
    },
    onError: (e) => toast.error(e.message),
  });
}
