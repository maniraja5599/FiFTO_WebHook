import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStrategies } from "@/hooks/useStrategies";
import { useSignals } from "@/hooks/useSignals";
import { Layers, Zap, TrendingUp, Activity, ArrowUpRight, Clock, ChevronRight, Bell } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const signalTypeLabels: Record<string, string> = {
  entry_buy: "Entry Buy",
  entry_sell: "Entry Sell",
  exit_buy: "Exit Buy",
  exit_sell: "Exit Sell",
};

const statusColors: Record<string, string> = {
  forwarded: "bg-primary/20 text-primary border-primary/20",
  failed: "bg-destructive/20 text-destructive border-destructive/20",
  pending: "bg-muted text-muted-foreground border-muted/20",
};

export default function Dashboard() {
  const { data: strategies = [] } = useStrategies();
  const { data: signals = [] } = useSignals({ limit: 20 });

  const todaySignals = signals.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  );

  const stats = [
    { label: "Total Strategies", value: strategies.length, icon: Layers, trend: "+2 this week", color: "text-blue-400" },
    { label: "Signals Today", value: todaySignals.length, icon: Zap, trend: "Live Tracking", color: "text-amber-400" },
    { label: "Active Strategies", value: strategies.filter((s) => s.enabled).length, icon: TrendingUp, trend: "85% capacity", color: "text-emerald-400" },
    { label: "Total Signals", value: signals.length, icon: Activity, trend: "Across all time", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 lg:p-12 glass-panel border-white/5 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <Badge variant="outline" className="px-3 py-1 border-primary/30 text-primary bg-primary/5 animate-pulse-subtle">
              System Live & Healthy
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-gradient">
              Welcome back, <span className="text-primary italic">Trader</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
              Your trading terminal is active. Monitoring <span className="text-white font-medium">{strategies.length} strategies</span> and processing real-time signals.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="glass-card p-4 rounded-2xl flex items-center gap-4 border-white/5 min-w-[200px]">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Market Status</div>
                <div className="text-sm font-semibold text-white">Market Open</div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <Card key={s.label} className="glass-card border-white/5 overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors duration-300", s.color)}>
                  <s.icon className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight text-white">{s.value}</div>
                <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{s.trend}</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Signals Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Execution Stream</h2>
          </div>
          <button className="text-xs font-bold uppercase tracking-widest text-primary hover:underline transition-all">
            View All Signals
          </button>
        </div>

        <Card className="glass-panel border-white/5 overflow-hidden">
          <CardContent className="p-0">
            {signals.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground/20" />
                </div>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">No signals detected yet. Your terminal is primed and waiting for TradingView webhooks.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {signals.slice(0, 10).map((sig) => (
                  <div key={sig.id} className="group flex items-center justify-between p-4 lg:p-6 hover:bg-white/[0.02] transition-colors duration-200">
                    <div className="flex items-center gap-4 lg:gap-6">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center text-xs font-bold border",
                        sig.signal_type.includes("buy") ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      )}>
                        {sig.signal_type.split("_")[1].toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-base text-white">{sig.strategies?.name}</span>
                          <Badge variant="outline" className="text-[10px] h-5 bg-white/5 border-white/10 uppercase tracking-tighter">
                            {sig.strategies?.symbol}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(sig.created_at), "MMM d, HH:mm:ss")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-8">
                      <div className="hidden lg:block text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">Signal Type</div>
                        <div className="text-xs font-semibold text-white/80">{signalTypeLabels[sig.signal_type]}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={cn("px-3 py-1 capitalize font-bold tracking-tight border", statusColors[sig.status])} variant="secondary">
                          {sig.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
