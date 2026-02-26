import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AngelOneProvider } from "@/hooks/useAngelOneData";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Strategies from "./pages/Strategies";
import ManualTrigger from "./pages/ManualTrigger";
import SignalHistory from "./pages/SignalHistory";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import StrategyDetail from "./pages/StrategyDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // loading
  if (!session) return <Auth />;
  return <AngelOneProvider>{children}</AngelOneProvider>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/strategies" element={<Strategies />} />
              <Route path="/strategies/:id" element={<StrategyDetail />} />
              <Route path="/trigger" element={<ManualTrigger />} />
              <Route path="/history" element={<SignalHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
