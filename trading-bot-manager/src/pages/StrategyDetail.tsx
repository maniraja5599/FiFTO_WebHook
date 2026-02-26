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
import { cn } from "@/lib/utils";

type Trade = {
  id: string;
  type: "buy" | "sell";
  symbol: string;
  entrySignal: Signal;
  exitSignal?: Signal;
  status: "open" | "closed";
  profit?: number;
  cumulativeProfit?: number;
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

  const handleFireSignal = (type: "entry_buy" | "entry_sell" | "exit_buy" | "exit_sell", price?: number) => {
    if (!strategy?.enabled) {
      toast.warning("Strategy is stopped. Please start the strategy first before triggering signals.");
      return;
    }
    fireSignal.mutate({
      strategy_id: id!,
      signal_type: type,
      price: price || currentLtp || 0,
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

    let runningProfit = 0;

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
          runningProfit += currentBuyTrade.profit;
          currentBuyTrade.cumulativeProfit = runningProfit;
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
          runningProfit += currentSellTrade.profit;
          currentSellTrade.cumulativeProfit = runningProfit;
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
    if (strategy?.angelone_token && hasConfig) {
      const fetchNow = async () => {
        const val = await getLTP(strategy.symbol, strategy.angelone_token!, strategy.exchange || 'NFO');
        if (val) setCurrentLtp(Number(val));
      };

      fetchNow();
      const timer = setInterval(fetchNow, 2000);
      return () => clearInterval(timer);
    }
  }, [strategy, hasConfig, getLTP]);


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

      {/* Ultra-Compact Top Stats Bar - Improved Mobile Stacking */}
      <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/40 shadow-xl px-4 py-3 sm:px-6 sm:py-2.5 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-2">
        <div className="flex items-center gap-2 sm:gap-3 md:border-r md:border-border/30 pr-2 sm:pr-6 pointer-events-none">
          <Activity className="h-4 w-4 text-emerald-500 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Complete Profit</span>
            <span className={`text-xs sm:text-sm font-black truncate ${displayProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              ₹ {displayProfit.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:border-r md:border-border/30 pr-2 sm:pr-6 pointer-events-none">
          <LineChart className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Today Profit</span>
            <span className={`text-xs sm:text-sm font-black truncate ${displayTodayProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              ₹ {displayTodayProfit.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 md:border-r md:border-border/30 pr-2 sm:pr-6 pointer-events-none">
          <PlayCircle className="h-4 w-4 text-sky-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Date Started</span>
            <span className="text-xs sm:text-sm font-black text-foreground truncate">
              {strategy?.created_at ? format(new Date(strategy.created_at), "dd MMM yyyy") : "---"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 last:border-0 pl-0 sm:pl-0">
          <Info className="h-4 w-4 text-rose-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-bold leading-tight">Current Status</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className={`text-[10px] sm:text-sm font-black ${strategy?.enabled ? "text-emerald-500" : "text-rose-500"}`}>
                {strategy?.enabled ? "STARTED" : "STOPPED"}
              </span>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "h-5 px-1.5 sm:h-6 sm:px-2 text-[7px] sm:text-[8px] font-black uppercase tracking-widest rounded transition-all",
                  strategy?.enabled
                    ? "hover:bg-rose-500 hover:text-white border-rose-500/20 text-rose-500"
                    : "hover:bg-emerald-500 hover:text-white border-emerald-500/20 text-emerald-500"
                )}
                onClick={() => {
                  if (strategy?.enabled && isPositionOpen) {
                    if (!confirm("⚠️ Warning: There is an open position on this strategy. Stopping it will NOT close the position automatically. Are you sure you want to stop?")) {
                      return;
                    }
                  }
                  updateStrategy.mutate({ id: strategy?.id!, enabled: !strategy?.enabled });
                }}
              >
                {strategy?.enabled ? "STOP" : "START"}
              </Button>
            </div>
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

        {/* Manual Trigger Buttons - All in one compact row */}
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "BUY", type: "entry_buy", btnColor: "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20", icon: TrendingUp },
              { label: "SELL", type: "entry_sell", btnColor: "text-rose-400 hover:bg-rose-500/10 border-rose-500/20", icon: TrendingDown },
              { label: "CLOSE BUY", type: "exit_buy", btnColor: "text-sky-400 hover:bg-sky-500/10 border-sky-500/20", icon: Square },
              { label: "CLOSE SELL", type: "exit_sell", btnColor: "text-amber-400 hover:bg-amber-500/10 border-amber-500/20", icon: Square },
            ].map((item) => {
              const isDisabled =
                !strategy?.enabled ||
                (item.type.startsWith("entry") && isPositionOpen) ||
                (item.type === "exit_buy" && (!isPositionOpen || openTradeType !== "entry_buy")) ||
                (item.type === "exit_sell" && (!isPositionOpen || openTradeType !== "entry_sell"));

              return (
                <Button
                  key={item.type}
                  variant="outline"
                  size="sm"
                  disabled={isDisabled}
                  className={`h-9 px-5 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${isDisabled
                    ? "opacity-30 grayscale cursor-not-allowed border-muted"
                    : item.btnColor
                    }`}
                  onClick={() => handleFireSignal(item.type as any, currentLtp || 0)}
                >
                  <item.icon className="h-3.5 w-3.5 fill-current" />
                  {item.label}
                  {!strategy?.enabled && <span className="text-[7px] ml-1 opacity-60">(STOPPED)</span>}
                </Button>
              );
            })}
          </div>
        </div>

        {/* URL Details - Only visible when showUrls is true */}
        {showUrls && (
          <div className="border-t border-border/30 divide-y divide-border/20 animate-in fade-in slide-in-from-top-2 duration-300">
            {[
              { label: "BUY", tokenField: "entry_buy_token", token: strategy?.entry_buy_token, color: "text-emerald-400", glow: "bg-emerald-500" },
              { label: "SELL", tokenField: "entry_sell_token", token: strategy?.entry_sell_token, color: "text-rose-400", glow: "bg-rose-500" },
              { label: "CLOSE BUY", tokenField: "exit_buy_token", token: strategy?.exit_buy_token, color: "text-sky-400", glow: "bg-sky-500" },
              { label: "CLOSE SELL", tokenField: "exit_sell_token", token: strategy?.exit_sell_token, color: "text-amber-400", glow: "bg-amber-500" },
            ].map((item, index) => {
              const isEditing = editingField === item.tokenField;
              const url = item.token ? getWebhookUrl(item.token) : "";

              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 gap-3 hover:bg-muted/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center shrink-0">
                      <div className={`w-2 h-2 rounded-full ${item.token ? item.glow : "bg-muted"}`} />
                      {item.token && <div className={`absolute w-2 h-2 rounded-full ${item.glow} animate-ping opacity-40`} />}
                    </div>
                    <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] min-w-[90px] font-mono ${item.color}`}>
                      {item.label}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-between gap-3">
                    {url ? (
                      <code className="text-[9px] font-mono text-primary/60 truncate max-w-[400px] select-all">{url}</code>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/40 italic">No token set</span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
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
                          {url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-muted/20 rounded-full"
                              title="Copy URL"
                              onClick={() => {
                                navigator.clipboard.writeText(url);
                                toast.success(`${item.label} URL copied!`);
                              }}
                            >
                              <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-muted/20 rounded-full"
                            title={url ? "Edit Token" : "Set Token"}
                            onClick={() => {
                              setEditingField(item.tokenField);
                              setEditValue(item.token || "");
                            }}
                          >
                            {url ? <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" /> : <Plus className="h-3 w-3 text-primary" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Entry Time & Price</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Exit Time & Price</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider text-right">Profit</TableHead>
                <TableHead className="text-muted-foreground font-semibold uppercase text-xs tracking-wider text-right">Cum. Profit</TableHead>
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
                      <div className="flex flex-col">
                        <span>{format(new Date(trade.entrySignal.created_at), "dd MMM yyyy hh:mm:ss a")}</span>
                        <span className="text-primary font-bold not-italic mt-0.5">
                          @ ₹ {Number(trade.entrySignal.price) > 0
                            ? Number(trade.entrySignal.price).toLocaleString()
                            : (currentLtp ? `${currentLtp.toLocaleString()} (Live)` : "---")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic text-xs">
                      {trade.exitSignal ? (
                        <div className="flex flex-col">
                          <span>{format(new Date(trade.exitSignal.created_at), "dd MMM yyyy hh:mm:ss a")}</span>
                          <span className="text-primary font-bold not-italic mt-0.5">@ ₹ {Number(trade.exitSignal.price || 0).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="opacity-40">Position Open</span>
                      )}
                    </TableCell>
                    <TableCell className={`font-bold text-right ${!trade.profit ? "text-muted-foreground" : (trade.profit >= 0 ? "text-emerald-500" : "text-rose-500")}`}>
                      {trade.profit ? `₹ ${trade.profit.toLocaleString()}` : "---"}
                    </TableCell>
                    <TableCell className={`font-bold text-right ${trade.cumulativeProfit === undefined ? "text-muted-foreground" : (trade.cumulativeProfit >= 0 ? "text-emerald-500" : "text-rose-500")}`}>
                      {trade.cumulativeProfit !== undefined ? `₹ ${Math.round(trade.cumulativeProfit).toLocaleString()}` : "---"}
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
