import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSignals } from "@/hooks/useSignals";
import { useStrategies } from "@/hooks/useStrategies";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

const COLORS = ["hsl(142,60%,50%)", "hsl(0,72%,55%)", "hsl(217,91%,65%)", "hsl(38,92%,55%)"];

export default function Analytics() {
  const { data: signals = [] } = useSignals();
  const { data: strategies = [] } = useStrategies();

  // Signal type distribution
  const typeDist = signals.reduce((acc, s) => {
    acc[s.signal_type] = (acc[s.signal_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(typeDist).map(([name, value]) => ({
    name: name.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    value,
  }));

  // Daily signal count (last 14 days)
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const day = startOfDay(subDays(new Date(), 13 - i));
    const count = signals.filter((s) => startOfDay(new Date(s.created_at)).getTime() === day.getTime()).length;
    return { date: format(day, "MMM d"), count };
  });

  // Per-strategy stats
  const strategyStats = strategies.map((st) => {
    const stSignals = signals.filter((s) => s.strategy_id === st.id);
    return {
      name: st.name,
      total: stSignals.length,
      forwarded: stSignals.filter((s) => s.status === "forwarded").length,
      failed: stSignals.filter((s) => s.status === "failed").length,
    };
  });

  const totalForwarded = signals.filter((s) => s.status === "forwarded").length;
  const successRate = signals.length > 0 ? Math.round((totalForwarded / signals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Signals</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{signals.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Success Rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{successRate}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Failed Signals</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-destructive">{signals.filter((s) => s.status === "failed").length}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Signals Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,16%,20%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215,15%,55%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,15%,55%)" />
                <Tooltip contentStyle={{ background: "hsl(224,24%,12%)", border: "1px solid hsl(224,16%,20%)" }} />
                <Line type="monotone" dataKey="count" stroke="hsl(142,60%,50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Signal Type Distribution</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(224,24%,12%)", border: "1px solid hsl(224,16%,20%)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {strategyStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Per-Strategy Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={strategyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224,16%,20%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(215,15%,55%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,15%,55%)" />
                <Tooltip contentStyle={{ background: "hsl(224,24%,12%)", border: "1px solid hsl(224,16%,20%)" }} />
                <Bar dataKey="forwarded" fill="hsl(142,60%,50%)" name="Forwarded" />
                <Bar dataKey="failed" fill="hsl(0,72%,55%)" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
