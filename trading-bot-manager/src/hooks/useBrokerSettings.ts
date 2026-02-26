import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BrokerSettings = {
    id: string;
    user_id: string;
    angelone_api_key?: string;
    angelone_client_code?: string;
    angelone_password?: string;
    angelone_totp_secret?: string;
    angelone_secret_key?: string;
    created_at: string;
    updated_at: string;
};

export function useBrokerSettings() {
    return useQuery({
        queryKey: ["broker_settings"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("broker_settings")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data as BrokerSettings | null;
        },
    });
}

export function useUpdateBrokerSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (updates: Partial<BrokerSettings>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Check if settings exist first (since we use unique(user_id))
            const { data: existing } = await supabase
                .from("broker_settings")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from("broker_settings")
                    .update(updates)
                    .eq("user_id", user.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("broker_settings")
                    .insert({ ...updates, user_id: user.id });
                if (error) throw error;
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["broker_settings"] });
            toast.success("Broker settings updated");
        },
        onError: (e) => toast.error(e.message),
    });
}
