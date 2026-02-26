import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStrategies } from "@/hooks/useStrategies";
import { useSignals } from "@/hooks/useSignals";
import { format } from "date-fns";

const signalTypeLabels: Record<string, string> = {
  entry_buy: "Entry Buy",
  entry_sell: "Entry Sell",
  exit_buy: "Exit Buy",
  exit_sell: "Exit Sell",
};

export default function SignalHistory() {
  const { data: strategies = [] } = useStrategies();
  const [strategyId, setStrategyId] = useState<string>("");
  const [signalType, setSignalType] = useState<string>("");
  const [source, setSource] = useState<string>("");

  const { data: signals = [], isLoading } = useSignals({
    strategyId: strategyId || undefined,
    signalType: signalType || undefined,
    source: source || undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Signal History</h1>

      <div className="flex flex-wrap gap-3">
        <Select value={strategyId} onValueChange={(v) => setStrategyId(v === "all" ? "" : v)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Strategies" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Strategies</SelectItem>
            {strategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={signalType} onValueChange={(v) => setSignalType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="entry_buy">Entry Buy</SelectItem>
            <SelectItem value="entry_sell">Entry Sell</SelectItem>
            <SelectItem value="exit_buy">Exit Buy</SelectItem>
            <SelectItem value="exit_sell">Exit Sell</SelectItem>
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={(v) => setSource(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Sources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : signals.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No signals found</TableCell></TableRow>
              ) : (
                signals.map((sig) => (
                  <TableRow key={sig.id}>
                    <TableCell className="text-xs">{format(new Date(sig.created_at), "MMM d, HH:mm:ss")}</TableCell>
                    <TableCell className="font-medium">{sig.strategies?.name}</TableCell>
                    <TableCell>{sig.strategies?.symbol}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={sig.signal_type.includes("buy") ? "border-primary text-primary" : "border-destructive text-destructive"}>
                        {signalTypeLabels[sig.signal_type]}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{sig.source}</Badge></TableCell>
                    <TableCell>{sig.price ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={sig.status === "forwarded" ? "default" : sig.status === "failed" ? "destructive" : "secondary"}>
                        {sig.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
