import { useParams, useNavigate } from "react-router-dom";
import { useStrategies, Strategy } from "@/hooks/useStrategies";
import { useSignals, useFireSignal } from "@/hooks/useSignals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isToday } from "date-fns";
import { ArrowLeft, Info, Download, LineChart, PlayCircle, FileText, Activity, Copy, Check, Edit2, ClipboardPaste, X, Zap, Plus, Eye, EyeOff, TrendingUp, TrendingDown, Square } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { getWebhookUrl } from "@/lib/webhook-url";
import { Input } from "@/components/ui/input";
import { useUpdateStrategy } from "@/hooks/useStrategies";
import { Signal } from "@/hooks/useSignals";
import { useAngelOneData } from "@/hooks/useAngelOneData";
import { Loader2 } from "lucide-react";

type Trade = {
  id: string;
  type: "buy" | "sell";
  symbol: string;
  entrySignal: Signal;
  exitSignal?: Signal;
  status: "open" | "closed";
  profit?: number;
};



export default function StrategyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: strategies = [] } = useStrategies();
  const strategy = strategies.find((s) => s.id === id);
  const { data: signals = [], isLoading } = useSignals({ strategyId: id });
  const fireSignal = useFireSignal();
  const updateStrategy = useUpdateStrategy();
  const [pageSize, setPageSize] = useState("10");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showUrls, setShowUrls] = useState(false);


  const { getLTP, hasConfig } = useAngelOneData();
  const [currentLtp, setCurrentLtp] = useState<number | null>(null);

  const handleFireSignal = (type: "entry_buy" | "entry_sell" | "exit_buy" | "exit_sell") => {
    fireSignal.mutate({
      strategy_id: id!,
      signal_type: type,
    }, {
      onSuccess: () => toast.success(`Signal ${type} triggered successfully`),
    });
  };

  const handleUpdateToken = async (field: string) => {

    if (!id) return;
    try {
      await updateStrategy.mutateAsync({ id, [field]: editValue });
      setEditingField(null);
    } catch (error) {
      console.error("Failed to update token:", error);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setEditValue(text);
      toast.success("Pasted from clipboard");
    } catch (err) {
      toast.error("Failed to read clipboard");
    }
  };


  // Logic to group signals into paired trades
  const groupSignalsIntoTrades = (sigs: Signal[]): Trade[] => {
    const sortedSigs = [...sigs].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const trades: Trade[] = [];
    let currentBuyTrade: Trade | null = null;
    let currentSellTrade: Trade | null = null;
    const quantity = (strategy?.lot_size || 1) * (strategy?.lot_deploy_qty || 1);

    sortedSigs.forEach((sig) => {
      if (sig.signal_type === "entry_buy") {
        if (!currentBuyTrade) {
          currentBuyTrade = {
            id: sig.id,
            type: "buy",
            symbol: strategy?.symbol || "",
            entrySignal: sig,
            status: "open"
          };
        }
      } else if (sig.signal_type === "exit_buy") {
        if (currentBuyTrade) {
          currentBuyTrade.exitSignal = sig;
          currentBuyTrade.status = "closed";
          const entryPrice = Number(currentBuyTrade.entrySignal.price) || 0;
          const exitPrice = Number(sig.price) || 0;
          currentBuyTrade.profit = (exitPrice - entryPrice) * quantity;
          trades.push(currentBuyTrade);
          currentBuyTrade = null;
        }
      } else if (sig.signal_type === "entry_sell") {
        if (!currentSellTrade) {
          currentSellTrade = {
            id: sig.id,
            type: "sell",
            symbol: strategy?.symbol || "",
            entrySignal: sig,
            status: "open"
          };
        }
      } else if (sig.signal_type === "exit_sell") {
        if (currentSellTrade) {
          currentSellTrade.exitSignal = sig;
          currentSellTrade.status = "closed";
          const entryPrice = Number(currentSellTrade.entrySignal.price) || 0;
          const exitPrice = Number(sig.price) || 0;
          currentSellTrade.profit = (entryPrice - exitPrice) * quantity;
          trades.push(currentSellTrade);
          currentSellTrade = null;
        }
      }
    });

    if (currentBuyTrade) trades.push(currentBuyTrade);
    if (currentSellTrade) trades.push(currentSellTrade);

    return trades.reverse(); // Newest first
  };

  const trades = groupSignalsIntoTrades(signals);
  const openTrade = trades.find(t => t.status === "open");
  const openTradeType = openTrade?.entrySignal.signal_type;
  const isPositionOpen = !!openTrade;

  // Calculate total profit including unrealized for open positions
  const quantity = (strategy?.lot_size || 1) * (strategy?.lot_deploy_qty || 1);
  const totalProfit = trades.reduce((acc, t) => {
    if (t.status === 'closed') return acc + (t.profit || 0);
    if (currentLtp) {
      const entryPrice = Number(t.entrySignal.price) || 0;
      const multiplier = t.type === 'buy' ? 1 : -1;
      return acc + (currentLtp - entryPrice) * quantity * multiplier;
    }
    return acc;
  }, 0);

  const todayProfit = trades
    .filter(t => isToday(new Date(t.entrySignal.created_at)))
    .reduce((acc, t) => {
      if (t.status === 'closed') return acc + (t.profit || 0);
      if (currentLtp) {
        const entryPrice = Number(t.entrySignal.price) || 0;
        const multiplier = t.type === 'buy' ? 1 : -1;
        return acc + (currentLtp - entryPrice) * quantity * multiplier;
      }
      return acc;
    }, 0);

  useEffect(() => {
    if (isPositionOpen && strategy?.angelone_token && hasConfig) {
      const timer = setInterval(async () => {
        const val = await getLTP(strategy.symbol, strategy.angelone_token!, strategy.exchange || 'NFO');
        if (val) setCurrentLtp(Number(val));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [isPositionOpen, strategy, hasConfig, getLTP]);


  const displayProfit = totalProfit;
  const displayTodayProfit = todayProfit;

  if (!strategy && !isLoading) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Strategy not found</p>
        <Button variant="link" onClick={() => navigate("/strategies")}>Back to strategies</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/strategies")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{strategy?.name || "Loading..."}</h1>
      </div>

      {/* Ultra-Compact Top Stats Bar */}
      <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/40 shadow-xl px-6 py-2.5 flex flex-wrap items-center justify-between gap-6 overflow-x-auto mb-2">
        <div className="flex items-center gap-3 border-r border-border/30 pr-6 last:border-0 pointer-events-none">
          <Activity className="h-4 w-4 text-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Complete Profit</span>
            <span className={`text-sm font-black ${displayProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              ₹ {displayProfit.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-r border-border/30 pr-6 last:border-0 pointer-events-none">
          <LineChart className="h-4 w-4 text-primary" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Today Profit</span>
            <span className={`text-sm font-black ${displayTodayProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              ₹ {displayTodayProfit.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-r border-border/30 pr-6 last:border-0 pointer-events-none">
          <PlayCircle className="h-4 w-4 text-sky-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Date Started</span>
            <span className="text-sm font-black text-foreground">
              {strategy?.created_at ? format(new Date(strategy.created_at), "dd MMM yyyy") : "---"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-r border-border/30 pr-6 last:border-0 pointer-events-none">
          <Info className="h-4 w-4 text-rose-400" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Current Status</span>
            <span className={`text-sm font-black ${strategy?.enabled ? "text-emerald-500" : "text-rose-500"}`}>
              {strategy?.enabled ? "STARTED" : "STOPPED"}
            </span>
          </div>
        </div>
      </div>



      <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/40 shadow-2xl overflow-hidden mt-4">
        <div className="px-6 py-2 border-b border-border/30 bg-muted/20 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Webhook Control Panel</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-full"
            onClick={() => setShowUrls(!showUrls)}
          >
            {showUrls ? <EyeOff className="h-3.5 w-3.5 mr-2" /> : <Eye className="h-3.5 w-3.5 mr-2" />}
            {showUrls ? "HIDE URLS" : "SHOW URLS"}
          </Button>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border/30">
          {[
            { label: "Entry Buy", type: "entry_buy", tokenField: "entry_buy_token", token: strategy?.entry_buy_token, color: "text-emerald-400", glow: "bg-emerald-500", btnColor: "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20", icon: TrendingUp },
            { label: "Entry Sell", type: "entry_sell", tokenField: "entry_sell_token", token: strategy?.entry_sell_token, color: "text-rose-400", glow: "bg-rose-500", btnColor: "text-rose-400 hover:bg-rose-500/10 border-rose-500/20", icon: TrendingDown },
            { label: "Exit Buy", type: "exit_buy", tokenField: "exit_buy_token", token: strategy?.exit_buy_token, color: "text-sky-400", glow: "bg-sky-500", btnColor: "text-sky-400 hover:bg-sky-500/10 border-sky-500/20", icon: Square },
            { label: "Exit Sell", type: "exit_sell", tokenField: "exit_sell_token", token: strategy?.exit_sell_token, color: "text-amber-400", glow: "bg-amber-500", btnColor: "text-amber-400 hover:bg-amber-500/10 border-amber-500/20", icon: Square },
          ].map((item, index) => {
            const isEditing = editingField === item.tokenField;
            const url = item.token ? getWebhookUrl(item.token) : "";

            return (
              <div key={index} className="flex flex-col md:flex-row md:items-center justify-between px-6 py-1.5 hover:bg-muted/5 transition-all gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex items-center justify-center">
                    <div className={`w-2 h-2 rounded-full ${item.token ? item.glow : "bg-muted"}`} />
                    {item.token && <div className={`absolute w-2 h-2 rounded-full ${item.glow} animate-ping opacity-40`} />}
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-[0.1em] min-w-[90px] font-mono ${item.color}`}>
                    {item.label}
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-between gap-4">
                  {/* Center: Trigger Button */}
                  <div className="flex-1 flex justify-center">
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          (item.type.startsWith("entry") && isPositionOpen) ||
                          (item.type === "exit_buy" && (!isPositionOpen || openTradeType !== "entry_buy")) ||
                          (item.type === "exit_sell" && (!isPositionOpen || openTradeType !== "entry_sell"))
                        }
                        className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${(item.type.startsWith("entry") && isPositionOpen) ||
                          (item.type === "exit_buy" && (!isPositionOpen || openTradeType !== "entry_buy")) ||
                          (item.type === "exit_sell" && (!isPositionOpen || openTradeType !== "entry_sell"))
                          ? "opacity-30 grayscale cursor-not-allowed border-muted"
                          : item.btnColor
                          }`}
                        title={
                          (item.type.startsWith("entry") && isPositionOpen)
                            ? "Entry restricted while position is open"
                            : (item.type.startsWith("exit") && !isPositionOpen)
                              ? "Exit restricted while no position is open"
                              : (item.type === "exit_buy" && openTradeType !== "entry_buy")
                                ? "Exit restricted: Active position is SELL"
                                : (item.type === "exit_sell" && openTradeType !== "entry_sell")
                                  ? "Exit restricted: Active position is BUY"
                                  : `Trigger ${item.label}`
                        }
                        onClick={() => handleFireSignal(item.type as "entry_buy" | "entry_sell" | "exit_buy" | "exit_sell")}
                      >
                        <item.icon className="h-3.5 w-3.5 fill-current" />
                        Trigger
                      </Button>
                    )}
                  </div>

                  {/* Right: Management Controls */}
                  <div className="flex items-center gap-4 min-w-[140px] justify-end">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Token..."
                          className="h-7 text-[10px] w-24 px-2 font-mono bg-muted/20 border-primary/20"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-500" onClick={() => handleUpdateToken(item.tokenField)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-400" onClick={handlePaste}>
                          <ClipboardPaste className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => setEditingField(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        {url ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted/20 rounded-full group/copy"
                              title="Copy URL"
                              onClick={() => {
                                navigator.clipboard.writeText(url);
                                toast.success(`${item.label} URL copied!`);
                              }}
                            >
                              <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover/copy:text-primary transition-colors" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted/20 rounded-full group/edit"
                              title="Edit Token"
                              onClick={() => {
                                setEditingField(item.tokenField);
                                setEditValue(item.token || "");
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground group-hover/edit:text-primary transition-colors" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[9px] text-primary hover:bg-primary/10 rounded-full font-bold"
                            onClick={() => {
                              setEditingField(item.tokenField);
                              setEditValue("");
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Set Token
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>





      {/* Transaction Table Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Transaction order details</h2>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-blue-500/5 text-blue-400 border-blue-500/20">
            {trades.length} Trades
          </Badge>
          <Button variant="secondary" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
            Show
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-16 h-8 bg-transparent border-border/20">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            orders
          </div>
        </div>

        <Card className="bg-card border border-border/50 overflow-hidden shadow-xl">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Case</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Status</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Entry Time</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Exit Time (Close)</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Profit</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Chart</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No trades found for this strategy.
                  </TableCell>
                </TableRow>
              ) : (
                trades.map((trade, idx) => (
                  <TableRow key={trade.id} className="border-border/10 hover:bg-muted/50 transition-colors">
                    <TableCell className="text-card-foreground font-medium">{(trades.length - idx)}</TableCell>
                    <TableCell>
                      <span className={`font-black tracking-tighter text-sm ${trade.entrySignal.signal_type.toLowerCase().includes("buy")
                        ? "text-emerald-500"
                        : "text-rose-500"
                        }`}>
                        {trade.entrySignal.signal_type.toLowerCase().includes("buy") ? "BUY" : "SELL"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic text-xs">
                      {format(new Date(trade.entrySignal.created_at), "dd MMM yyyy hh:mm:ss a")}
                    </TableCell>
                    <TableCell className="text-muted-foreground italic text-xs">
                      {trade.exitSignal
                        ? format(new Date(trade.exitSignal.created_at), "dd MMM yyyy hh:mm:ss a")
                        : "---"}
                    </TableCell>
                    <TableCell className={`font-bold ${!trade.profit ? "text-muted-foreground" : (trade.profit >= 0 ? "text-emerald-500" : "text-rose-500")}`}>
                      {trade.profit ? `₹ ${trade.profit.toLocaleString()}` : "---"}
                    </TableCell>
                    <TableCell>
                      <LineChart className="h-4 w-4 text-primary cursor-pointer hover:scale-110 transition-transform" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      </div>
    </div>
  );
}
