import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStrategies } from "@/hooks/useStrategies";
import { useSignals } from "@/hooks/useSignals";
import { Layers, Zap, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";

const signalTypeLabels: Record<string, string> = {
  entry_buy: "Entry Buy",
  entry_sell: "Entry Sell",
  exit_buy: "Exit Buy",
  exit_sell: "Exit Sell",
};

const statusColors: Record<string, string> = {
  forwarded: "bg-primary/20 text-primary",
  failed: "bg-destructive/20 text-destructive",
  pending: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const { data: strategies = [] } = useStrategies();
  const { data: signals = [] } = useSignals({ limit: 20 });

  const todaySignals = signals.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  );

  const stats = [
    { label: "Total Strategies", value: strategies.length, icon: Layers },
    { label: "Signals Today", value: todaySignals.length, icon: Zap },
    { label: "Active Strategies", value: strategies.filter((s) => s.enabled).length, icon: TrendingUp },
    { label: "Total Signals", value: signals.length, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Signals</CardTitle>
        </CardHeader>
        <CardContent>
          {signals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No signals yet. Create a strategy and fire your first signal!</p>
          ) : (
            <div className="space-y-3">
              {signals.slice(0, 15).map((sig) => (
                <div key={sig.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={sig.signal_type.includes("buy") ? "border-primary text-primary" : "border-destructive text-destructive"}>
                      {signalTypeLabels[sig.signal_type]}
                    </Badge>
                    <div>
                      <span className="font-medium text-sm">{sig.strategies?.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">{sig.strategies?.symbol}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[sig.status]} variant="secondary">
                      {sig.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(sig.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
