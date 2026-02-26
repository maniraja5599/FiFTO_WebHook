import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useStrategies } from "@/hooks/useStrategies";
import { useFireSignal } from "@/hooks/useSignals";
import { Crosshair } from "lucide-react";

const signalTypes = [
  { value: "entry_buy", label: "Entry Buy" },
  { value: "entry_sell", label: "Entry Sell" },
  { value: "exit_buy", label: "Exit Buy" },
  { value: "exit_sell", label: "Exit Sell" },
] as const;

export default function ManualTrigger() {
  const { data: strategies = [] } = useStrategies();
  const fireSignal = useFireSignal();
  const [strategyId, setStrategyId] = useState("");
  const [signalType, setSignalType] = useState<string>("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const handleFire = () => {
    fireSignal.mutate(
      {
        strategy_id: strategyId,
        signal_type: signalType as any,
        price: price ? Number(price) : undefined,
        quantity: quantity ? Number(quantity) : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          setPrice("");
          setQuantity("");
          setNotes("");
        },
      }
    );
  };

  const activeStrategies = strategies.filter((s) => s.enabled);

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Manual Trigger</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Fire Signal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Strategy</Label>
            <Select value={strategyId} onValueChange={setStrategyId}>
              <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
              <SelectContent>
                {activeStrategies.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.symbol})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Signal Type</Label>
            <Select value={signalType} onValueChange={setSignalType}>
              <SelectTrigger><SelectValue placeholder="Select signal type" /></SelectTrigger>
              <SelectContent>
                {signalTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Price (optional)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Quantity (optional)</Label><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" /></div>
          </div>
          <div><Label>Notes (optional)</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." /></div>
          <Button className="w-full" size="lg" disabled={!strategyId || !signalType || fireSignal.isPending} onClick={handleFire}>
            {fireSignal.isPending ? "Firing..." : "🔥 Fire Signal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
