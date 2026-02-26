import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type Strategy = {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  description: string;
  webhook_url: string;
  webhook_url_entry_buy: string;
  webhook_url_entry_sell: string;
  webhook_url_exit_buy: string;
  webhook_url_exit_sell: string;
  enabled: boolean;
  entry_buy_token: string;
  entry_sell_token: string;
  exit_buy_token: string;
  exit_sell_token: string;
  lot_size: number;
  lot_deploy_qty: number;
  angelone_token: string | null;
  exchange: string;
  created_at: string;
  updated_at: string;
};

export function useStrategies() {
  return useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Strategy[];
    },
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (strategy: {
      name: string;
      symbol: string;
      description?: string;
      webhook_url_entry_buy?: string;
      webhook_url_entry_sell?: string;
      webhook_url_exit_buy?: string;
      webhook_url_exit_sell?: string;
      lot_size: number;
      lot_deploy_qty: number;
      angelone_token: string | null;
      exchange: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("strategies").insert({
        ...strategy,
        user_id: user.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Strategy> & { id: string }) => {
      const { error } = await supabase.from("strategies").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy updated");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("strategies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}
