import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy, Strategy } from "@/hooks/useStrategies";
import { useSignals } from "@/hooks/useSignals";
import { useAngelOne, useAngelOneData } from "@/hooks/useAngelOneData";
import { getWebhookUrl } from "@/lib/webhook-url";
import { Link, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFireSignal } from "@/hooks/useSignals";


import { Plus, Trash2, Pencil, ChevronRight, Eye, Info, Search, TrendingUp, TrendingDown, Copy, Loader2, Layers, Zap, Activity, Clock, Bell, ArrowUpRight } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";



import { toast } from "sonner";
import { format } from "date-fns";

const signalTypeLabels: Record<string, string> = {
  entry_buy: "Entry Buy",
  entry_sell: "Entry Sell",
  exit_buy: "Exit Buy",
  exit_sell: "Exit Sell",
};

const INDEX_OPTIONS = ["NIFTY", "SENSEX", "MIDCAP", "BANKNIFTY", "FINNIFTY", "BANKEX"];
const FO_STOCKS = [
  "ABB", "ABBOTBHA", "ABCAPITAL", "ABFRL", "ACC", "ADANIENSOL", "ADANIENT", "ADANIPORTS", "ADANIPOWER", "ALKEM",
  "AMBUJACEM", "ANGELONE", "APOLLOHOSP", "APOLLOTYRE", "ASHOKLEY", "ASIANPAINT", "ASTRAL", "AUBANK", "AUROPHARMA", "AXISBANK",
  "BAJAJ-AUTO", "BAJAJFINSV", "BAJFINANCE", "BALKRISIND", "BALRAMCHIN", "BANDHANBNK", "BANKBARODA", "BANKINDIA", "BEL", "BERGEPAINT",
  "BHARATFORG", "BHARTIARTL", "BHEL", "BIOCON", "BOSCHLTD", "BPCL", "BRITANNIA", "BSE", "CANBK", "CANFINHOME",
  "CDSL", "CHAMBLFERT", "CHOLAFIN", "CIPLA", "COALINDIA", "COFORGE", "COLPAL", "CONCOR", "COROMANDEL", "CROMPTON",
  "CUB", "CUMMINSIND", "DABUR", "DALBHARAT", "DEEPMTR", "DELHIVERY", "DIVISLAB", "DIXON", "DLF", "DMART",
  "DRREDDY", "EICHERMOT", "ESCORTS", "EXIDEIND", "FEDERALBNK", "FORTIS", "GAIL", "GLENMARK", "GMRAEROPRT", "GNFC",
  "GODREJCP", "GODREJPROP", "GRANULES", "GRASIM", "GUJGASLTD", "HAL", "HAVELLS", "HCLTECH", "HDFCBANK", "HDFCLIFE",
  "HEROMOTOCO", "HINDALCO", "HINDCOPPER", "HINDPETRO", "HINDUNILVR", "ICICIBANK", "ICICIGI", "ICICIPRULI", "IDFC", "IDFCFIRSTB",
  "IEX", "IGL", "IIFL", "INDHOTEL", "INDIACEM", "INDIAMART", "INDIGO", "INDUSINDBK", "INDUSTOWER", "INFY",
  "IOC", "IPCALAB", "IREDA", "IRFC", "IRCTC", "ITC", "JINDALSTEL", "JIOFIN", "JKCEMENT", "JSWENERGY",
  "JSWSTEEL", "JUBLFOOD", "KAYNES", "KOTAKBANK", "KPIT", "L&TFH", "LALPATHLAB", "LAURUSLABS", "LICHSGFIN", "LICI",
  "LT", "LTIM", "LTTS", "LUPIN", "M&M", "M&MFIN", "MANAPPURAM", "MARICO", "MARUTI", "MAZDOCK",
  "MCX", "METROPOLIS", "MFSL", "MGL", "MOTHERSON", "MPHASIS", "MRF", "MUTHOOTFIN", "NATIONALUM", "NAVINFLUOR",
  "NBCC", "NESTLEIND", "NHPC", "NMDC", "NTPC", "OBEROIRLTY", "OFSS", "ONGC", "PAGEIND", "PEL",
  "PERSISTENT", "PETRONET", "PFC", "PIDILITIND", "PIIND", "PNB", "POLY CAB", "POWERGRID", "PVRINOX", "RAMCOCEM",
  "RATNAMANI", "RBLBANK", "RECPYRAMAL", "RELIANCE", "SAIL", "SBICARD", "SBILIFE", "SBIN", "SHREECEM", "SHRIRAMFIN",
  "SIEMENS", "SOLARINDS", "SRF", "STFC", "SUNPHARMA", "SUNTV", "SYNGENE", "TATACHEM", "TATACOMM", "TATACONSUM",
  "TATAELXSI", "TATAMOTORS", "TATAPOWER", "TATASTEEL", "TATATECH", "TCS", "TECHM", "TITAN", "TORNTPHARM", "TORNTPOWER",
  "TRENT", "TVSMOTOR", "UBL", "ULTRACEMCO", "UPL", "VBL", "VEDL", "VOLTAS", "WIPRO", "YESBANK", "ZOMATO"
];


const getUniqueName = (baseName: string, existingNames: string[]) => {
  let name = baseName;
  let counter = 1;
  while (existingNames.includes(name)) {
    name = `${baseName}-${counter}`;
    counter++;
  }
  return name;
};

const formatINR = (value: number, decimals = 1) => {
  const absVal = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  return `${sign}₹ ${absVal.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

function StrategyRow({ strategy, strategies, allSignals }: { strategy: Strategy, strategies: Strategy[], allSignals: any[] }) {

  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [stockPopoverOpen, setStockPopoverOpen] = useState(false);

  const updateStrategy = useUpdateStrategy();
  const deleteStrategy = useDeleteStrategy();
  const fireSignal = useFireSignal();

  // Use allSignals from props instead of fetching locally if possible, 
  // but StrategyRow was fetching with limit 50 specifically for its own signals.
  // Let's filter allSignals for this strategy.
  const signals = allSignals.filter(sig => sig.strategy_id === strategy.id);

  const [form, setForm] = useState({
    name: strategy.name,
    symbol: strategy.symbol,
    description: strategy.description || "",
    lot_size: strategy.lot_size || 1,
    lot_deploy_qty: strategy.lot_deploy_qty || 1,
    webhook_url_entry_buy: strategy.webhook_url_entry_buy || "",
    webhook_url_entry_sell: strategy.webhook_url_entry_sell || "",
    webhook_url_exit_buy: strategy.webhook_url_exit_buy || "",
    webhook_url_exit_sell: strategy.webhook_url_exit_sell || "",
  });

  const handleUpdate = () => {
    updateStrategy.mutate({ id: strategy.id, ...form }, {
      onSuccess: () => setEditOpen(false),
    });
  };

  const resetForm = () => {
    setForm({
      name: strategy.name,
      symbol: strategy.symbol,
      description: strategy.description || "",
      lot_size: strategy.lot_size || 1,
      lot_deploy_qty: strategy.lot_deploy_qty || 1,
      webhook_url_entry_buy: strategy.webhook_url_entry_buy || "",
      webhook_url_entry_sell: strategy.webhook_url_entry_sell || "",
      webhook_url_exit_buy: strategy.webhook_url_exit_buy || "",
      webhook_url_exit_sell: strategy.webhook_url_exit_sell || "",
    });
  };

  const { getLTP, hasConfig } = useAngelOneData();
  const [currentLtp, setCurrentLtp] = useState<number | null>(null);

  // Determine if there is an open position
  const sortedSigs = [...signals].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  let lastEntry: (typeof signals)[0] | null = null;
  let isActive = false;

  sortedSigs.forEach(sig => {
    if (sig.signal_type.startsWith('entry')) {
      lastEntry = sig;
      isActive = true;
    } else if (sig.signal_type.startsWith('exit')) {
      isActive = false;
    }
  });

  // Calculate realized + unrealized P&L
  const quantity = (strategy.lot_size || 1) * (strategy.lot_deploy_qty || 1);
  let overallProfit = 0;
  let currentTradeProfit: number | null = null;
  let lastTradeProfit: number | null = null;
  let tempActive: { type: string; price: number } | null = null;

  sortedSigs.forEach(sig => {
    const sigPrice = Number(sig.price) || 0;
    if (sig.signal_type.startsWith('entry')) {
      if (sigPrice > 0) {
        tempActive = { type: sig.signal_type, price: sigPrice };
      }
    } else if (sig.signal_type.startsWith('exit') && tempActive) {
      if (sigPrice > 0) {
        const multiplier = tempActive.type === 'entry_buy' ? 1 : -1;
        const tradeProfit = (sigPrice - tempActive.price) * quantity * multiplier;
        overallProfit += tradeProfit;
        lastTradeProfit = tradeProfit;
        tempActive = null;
      }
    }
  });

  // Calculate current trade profit (unrealized) if still in position
  if (tempActive && currentLtp) {
    const multiplier = tempActive.type === 'entry_buy' ? 1 : -1;
    currentTradeProfit = (currentLtp - tempActive.price) * quantity * multiplier;
    overallProfit += currentTradeProfit;
  }

  const handleSquareOff = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!tempActive) return;

    const exitType = tempActive.type === 'entry_buy' ? 'exit_buy' : 'exit_sell';
    fireSignal.mutate({
      strategy_id: strategy.id,
      signal_type: exitType,
      price: currentLtp || 0
    });
    toast.success(`Square Off signal sent for ${strategy.name}`);
  };

  useEffect(() => {
    if (strategy.angelone_token && hasConfig) {
      const fetchNow = async () => {
        const val = await getLTP(strategy.symbol, strategy.angelone_token!, strategy.exchange || 'NFO');
        if (val) setCurrentLtp(val);
      };

      fetchNow();
      const timer = setInterval(fetchNow, 2000);
      return () => clearInterval(timer);
    }
  }, [strategy.angelone_token, strategy.symbol, strategy.exchange, hasConfig, getLTP]);

  return (
    <div className={cn(
      "bg-card border rounded-lg shadow-sm overflow-hidden mb-3 group transition-all duration-300",
      isActive ? "border-emerald-500/50 bg-emerald-500/[0.04] ring-1 ring-emerald-500/20 animate-pulse-subtle" : "border-border/50",
      !strategy.enabled && "opacity-60"
    )}>
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors gap-4"
        onClick={() => navigate(`/strategies/${strategy.id}`)}
      >

        <div className="flex items-center gap-3 w-full sm:flex-1">
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wide leading-tight truncate">{strategy.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Badge className="bg-primary/20 text-primary border-0 text-[9px] h-4 px-1.5 rounded font-semibold uppercase tracking-wider">
                  {strategy.exchange === 'NFO' ? 'F&O' : 'Cash'}
                </Badge>
                <Badge className="bg-muted/50 text-muted-foreground border-0 text-[9px] h-4 px-1.5 rounded font-semibold uppercase tracking-wider">
                  {quantity} QTY
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`} />
                <span className="text-[10px] text-muted-foreground/80 font-medium italic truncate">
                  {isActive ? `Position Open (${lastEntry?.signal_type === 'entry_buy' ? 'BUY' : 'SELL'})` : 'Waiting for Next Entry Signal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-8 border-t sm:border-t-0 border-border/30 pt-3 sm:pt-0">
          <div className="flex flex-col items-start sm:items-end min-w-[80px] sm:min-w-[100px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
              {isActive ? "Open P&L" : "Last Trade"}
            </span>
            <div className={cn(
              "text-xs font-bold",
              isActive
                ? (currentTradeProfit === null ? "text-muted-foreground" : (currentTradeProfit >= 0 ? "text-emerald-500" : "text-rose-500"))
                : (lastTradeProfit === null ? "text-muted-foreground" : (lastTradeProfit >= 0 ? "text-emerald-500/80" : "text-rose-500/80"))
            )}>
              {isActive
                ? (currentTradeProfit === null ? "---" : formatINR(currentTradeProfit))
                : (lastTradeProfit === null ? "No Trades" : formatINR(lastTradeProfit))
              }
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end min-w-[80px] sm:min-w-[100px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Overall P&L</span>
            <div className={`text-sm sm:text-base font-black tracking-tight ${overallProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {formatINR(overallProfit)}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 min-w-[70px] sm:min-w-[80px]">
            <Badge className={cn(
              "text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 border-0 rounded",
              strategy.enabled
                ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                : "bg-muted text-muted-foreground"
            )}>
              {strategy.enabled ? "LIVE" : "STOPPED"}
            </Badge>
            {isActive && (
              <Button
                size="sm"
                variant="destructive"
                className="h-6 w-full text-[8px] font-black uppercase tracking-widest rounded shadow-lg shadow-destructive/10"
                onClick={handleSquareOff}
              >
                Square Off
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Strategies() {
  const { data: strategies = [], isLoading } = useStrategies();
  const createStrategy = useCreateStrategy();
  const [open, setOpen] = useState(false);
  const [stockPopoverOpen, setStockPopoverOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", symbol: "NIFTY", description: "",
    webhook_url_entry_buy: "", webhook_url_entry_sell: "",
    webhook_url_exit_buy: "", webhook_url_exit_sell: "",
    lot_size: 1, lot_deploy_qty: 1, angelone_token: "", exchange: "NFO"
  });

  const [instrumentType, setInstrumentType] = useState<"INDEX" | "FUTURE">("INDEX");
  const [sortBy, setSortBy] = useState<"name" | "profit" | "date" | "status">("date");
  const [filterBy, setFilterBy] = useState<"all" | "live" | "stopped">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { getLTP, findIndexInstrument, findFutureInstrument, hasConfig, isConnecting: angelLoading, isConnected } = useAngelOne();
  const [ltp, setLtp] = useState<number | null>(null);
  const [ltpLabel, setLtpLabel] = useState<string>("");

  const { data: allSignals = [] } = useSignals();

  const fetchLtp = async (symbol: string, type: "INDEX" | "FUTURE") => {
    setLtp(null);
    setLtpLabel("");
    if (!hasConfig) return;
    const instrument = type === "INDEX" ? await findIndexInstrument(symbol) : await findFutureInstrument(symbol);
    if (instrument) {
      setLtpLabel(`${instrument.symbol} (${instrument.expiry})`);
      const val = await getLTP(instrument.symbol, instrument.token, instrument.exch_seg);
      if (val) {
        setLtp(val);
        setForm(prev => ({ ...prev, angelone_token: instrument.token, lot_size: Number(instrument.lotsize) || 1, exchange: instrument.exch_seg }));
      }
    }
  };

  useEffect(() => {
    if (open && form.symbol) {
      fetchLtp(form.symbol, instrumentType);
    }
  }, [open, form.symbol, instrumentType, hasConfig]);

  const handleCreate = () => {
    createStrategy.mutate(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({
          name: "", symbol: "NIFTY", description: "",
          webhook_url_entry_buy: "", webhook_url_entry_sell: "",
          webhook_url_exit_buy: "", webhook_url_exit_sell: "",
          lot_size: 1, lot_deploy_qty: 1, angelone_token: "", exchange: "NFO"
        });
        setInstrumentType("INDEX");
      },
    });
  };

  // Summary Stats
  const totalRunCount = allSignals.length;

  // Real P&L calculation logic
  const calculatePL = (isTodayOnly = false) => {
    if (!allSignals.length || !strategies.length) return 0;

    const todayStr = new Date().toDateString();

    const signalsByStrategy = allSignals.reduce((acc, sig) => {
      if (!acc[sig.strategy_id]) acc[sig.strategy_id] = [];
      acc[sig.strategy_id].push(sig);
      return acc;
    }, {} as Record<string, (typeof allSignals)[0][]>);

    let total = 0;
    Object.entries(signalsByStrategy).forEach(([sid, sigs]) => {
      const s = strategies.find(strat => strat.id === sid);
      if (!s) return;

      const quantity = (s.lot_size || 1) * (s.lot_deploy_qty || 1);
      const sorted = [...sigs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      let active: { type: string; price: number; time: string } | null = null;
      sorted.forEach(sig => {
        const sigPrice = Number(sig.price) || 0;
        const sigTime = new Date(sig.created_at);
        const isToday = sigTime.toDateString() === todayStr;

        if (sig.signal_type.startsWith('entry')) {
          if (sigPrice > 0) {
            active = { type: sig.signal_type, price: sigPrice, time: sig.created_at };
          }
        } else if (sig.signal_type.startsWith('exit') && active) {
          if (sigPrice > 0) {
            const multiplier = active.type === 'entry_buy' ? 1 : -1;
            const tradeProfit = (sigPrice - active.price) * quantity * multiplier;

            if (!isTodayOnly || isToday) {
              total += tradeProfit;
            }
            active = null;
          }
        }
      });
    });
    return total;
  };

  const overallProfit = calculatePL(false);
  const todayProfit = calculatePL(true);

  // Stats for the new grid
  const totalStrategies = strategies.length;
  const liveStrategiesCount = strategies.filter(s => s.enabled).length;

  // Count open positions across all strategies
  const openPositionsCount = strategies.filter(s => {
    const stratSigs = allSignals.filter(sig => sig.strategy_id === s.id);
    const sorted = [...stratSigs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    let isOpen = false;
    sorted.forEach(sig => {
      if (sig.signal_type.startsWith('entry')) isOpen = true;
      else if (sig.signal_type.startsWith('exit')) isOpen = false;
    });
    return isOpen;
  }).length;

  // Handle Square Off All
  const fireSignal = useFireSignal();
  const handleSquareOffAll = () => {
    const openStrategies = strategies.filter(s => {
      const stratSigs = allSignals.filter(sig => sig.strategy_id === s.id);
      const sorted = [...stratSigs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      let isOpen = false;
      sorted.forEach(sig => {
        if (sig.signal_type.startsWith('entry')) isOpen = true;
        else if (sig.signal_type.startsWith('exit')) isOpen = false;
      });
      return isOpen;
    });

    if (openStrategies.length === 0) {
      toast.info("No open positions to square off");
      return;
    }

    if (confirm(`Are you sure you want to square off ALL ${openStrategies.length} open positions?`)) {
      openStrategies.forEach(s => {
        const stratSigs = allSignals.filter(sig => sig.strategy_id === s.id);
        const lastEntry = [...stratSigs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .find(sig => sig.signal_type.startsWith('entry'));

        if (lastEntry) {
          const exitType = lastEntry.signal_type === 'entry_buy' ? 'exit_buy' : 'exit_sell';
          fireSignal.mutate({
            strategy_id: s.id,
            signal_type: exitType,
            price: 0 // Will use LTP or last known
          });
        }
      });
      toast.success(`Square off signals sent for ${openStrategies.length} strategies`);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl py-6 px-4 sm:py-10 sm:px-8 space-y-10 animate-in fade-in duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Strategies */}
        <div className="glass-card border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layers className="h-16 w-16 text-primary" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Total Managed</p>
          <div className="flex items-end gap-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-white">{strategies.length}</h2>
            <span className="text-xs font-semibold text-muted-foreground/60 mb-1">Strategies</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[9px] font-bold">STABLE</Badge>
          </div>
        </div>

        {/* Live Positions */}
        <div className="glass-card border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap className="h-16 w-16 text-amber-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Active Signal</p>
          <div className="flex items-end gap-2">
            <h2 className="text-4xl font-extrabold tracking-tight text-amber-500">{openPositionsCount}</h2>
            <span className="text-xs font-semibold text-muted-foreground/60 mb-1">Trades</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-semibold italic">Markets Monitoring</span>
          </div>
        </div>

        {/* Today Profit */}
        <div className={cn(
          "glass-card border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group",
          todayProfit >= 0 ? "shadow-emerald-500/5" : "shadow-rose-500/5"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp className={cn("h-16 w-16", todayProfit >= 0 ? "text-emerald-500" : "text-rose-500")} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Today's Performance</p>
          <div className="flex items-end gap-2">
            <h2 className={cn("text-3xl font-extrabold tracking-tight", todayProfit >= 0 ? "text-emerald-500" : "text-rose-500")}>
              {formatINR(todayProfit, 0)}
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className={cn(
              "text-[9px] font-bold border-0",
              todayProfit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
              {todayProfit >= 0 ? "PROFIT" : "LOSS"}
            </Badge>
          </div>
          {todayProfit !== 0 && (
            <div className={cn(
              "absolute bottom-0 left-0 h-1 transition-all duration-500 group-hover:h-2",
              todayProfit >= 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
            )} style={{ width: '100%' }} />
          )}
        </div>

        {/* Overall Profit */}
        <div className={cn(
          "glass-card border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group",
          overallProfit >= 0 ? "shadow-primary/5" : "shadow-rose-500/5"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className={cn("h-16 w-16", overallProfit >= 0 ? "text-primary" : "text-rose-500")} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Total Cumulative</p>
          <div className="flex items-end gap-2">
            <h2 className={cn("text-3xl font-extrabold tracking-tight", overallProfit >= 0 ? "text-primary" : "text-rose-500")}>
              {formatINR(overallProfit, 0)}
            </h2>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-semibold italic">Entire Portfolio P&L</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl gap-6">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gradient">Strategies</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 min-w-[200px] lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                placeholder="Search strategies..."
                className="h-11 pl-10 bg-white/5 border-white/10 rounded-xl text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 lg:h-11">
              {['all', 'live', 'stopped'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterBy(f as any)}
                  className={cn(
                    "px-4 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all duration-300",
                    filterBy === f ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 lg:flex-none">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="h-11 bg-white/5 border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest min-w-[130px]">
                  <SelectValue placeholder="Sort..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Creation Date</SelectItem>
                  <SelectItem value="name">Strategy Name</SelectItem>
                  <SelectItem value="profit">Profitability</SelectItem>
                  <SelectItem value="status">Live Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 px-2 pt-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-9 px-5 text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> New Strategy
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Create Trading Strategy</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-5 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instrument Type</Label>
                  <Select
                    value={instrumentType}
                    onValueChange={(v: "INDEX" | "FUTURE") => {
                      setInstrumentType(v);
                      const newSymbol = v === "INDEX" ? "NIFTY" : FO_STOCKS[0];
                      const prefix = v === "INDEX" ? "IDXFUT" : "STKFUT";
                      const baseName = `${prefix}-${newSymbol}`;
                      const existingNames = strategies.map(s => s.name);
                      setForm({ ...form, symbol: newSymbol, name: getUniqueName(baseName, existingNames) });
                      fetchLtp(newSymbol, v);
                    }}
                  >
                    <SelectTrigger className="h-10 font-bold"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDEX">INDEX</SelectItem>
                      <SelectItem value="FUTURE">FUTURE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{instrumentType === "INDEX" ? "Select Index" : "Select Stock"}</Label>
                  {instrumentType === "INDEX" ? (
                    <Select
                      value={form.symbol}
                      onValueChange={(v) => {
                        const baseName = `IDXFUT-${v}`;
                        const existingNames = strategies.map(s => s.name);
                        setForm({ ...form, symbol: v, name: getUniqueName(baseName, existingNames) });
                        fetchLtp(v, "INDEX");
                      }}
                    >
                      <SelectTrigger className="h-10 font-bold"><SelectValue placeholder="Select Index" /></SelectTrigger>
                      <SelectContent>{INDEX_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Popover open={stockPopoverOpen} onOpenChange={setStockPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-10 font-bold">
                          {form.symbol || "Select Stock"}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search stock..." className="h-9" />
                          <CommandEmpty>No stock found.</CommandEmpty>
                          <CommandList className="max-h-[300px] overflow-y-auto">
                            <CommandGroup>
                              {FO_STOCKS.sort().map((stock) => (
                                <CommandItem
                                  key={stock}
                                  value={stock}
                                  onSelect={(currentValue) => {
                                    const symbol = currentValue.toUpperCase();
                                    const baseName = `STKFUT-${symbol}`;
                                    const existingNames = strategies.map(s => s.name);
                                    setForm({ ...form, symbol: symbol, name: getUniqueName(baseName, existingNames) });
                                    fetchLtp(symbol, "FUTURE");
                                    setStockPopoverOpen(false);
                                  }}
                                >
                                  {stock}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lot Deploy Qty</Label>
                  <Input
                    type="number"
                    value={form.lot_deploy_qty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm({ ...form, lot_deploy_qty: isNaN(val) ? 1 : val });
                    }}
                    className="h-10 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calculated Quantity</Label>
                  <div className="h-10 flex items-center px-3 bg-muted/30 border border-border/50 rounded-md font-mono font-bold text-sm text-primary">
                    {form.lot_size} qty × {form.lot_deploy_qty} lot = {form.lot_size * form.lot_deploy_qty}
                  </div>
                </div>

                {ltp !== null && (
                  <div className="col-span-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Live Price</span>
                      </div>
                      <span className="text-lg font-black text-emerald-400 font-mono">₹ {ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {ltpLabel && (
                      <div className="text-[9px] font-bold text-emerald-500/50 mt-1 tracking-wide">
                        {ltpLabel} • Lot Size: {form.lot_size}
                      </div>
                    )}
                  </div>
                )}

                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Strategy Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. NIFTY BULLISH BUY" className="h-10 font-bold" />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="h-10" />
                </div>

                <div className="col-span-2 space-y-3 mt-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-1">Forward Webhook URLs</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-muted-foreground">Entry Buy</Label><Input value={form.webhook_url_entry_buy} onChange={(e) => setForm({ ...form, webhook_url_entry_buy: e.target.value })} placeholder="https://..." className="h-8 text-[11px]" /></div>
                    <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-muted-foreground">Entry Sell</Label><Input value={form.webhook_url_entry_sell} onChange={(e) => setForm({ ...form, webhook_url_entry_sell: e.target.value })} placeholder="https://..." className="h-8 text-[11px]" /></div>
                    <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-muted-foreground">Exit Buy</Label><Input value={form.webhook_url_exit_buy} onChange={(e) => setForm({ ...form, webhook_url_exit_buy: e.target.value })} placeholder="https://..." className="h-8 text-[11px]" /></div>
                    <div className="space-y-1"><Label className="text-[9px] font-bold uppercase text-muted-foreground">Exit Sell</Label><Input value={form.webhook_url_exit_sell} onChange={(e) => setForm({ ...form, webhook_url_exit_sell: e.target.value })} placeholder="https://..." className="h-8 text-[11px]" /></div>
                  </div>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="font-bold uppercase tracking-wider text-xs px-6">Cancel</Button>
                <Button onClick={handleCreate} disabled={!form.name || !form.symbol || angelLoading} className="font-black uppercase tracking-widest text-xs px-8 shadow-lg shadow-primary/20">
                  {angelLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Strategy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="destructive"
            className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl h-9 px-5 text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-rose-500/5 transition-all active:scale-95 group"
            onClick={handleSquareOffAll}
          >
            <Zap className="h-3.5 w-3.5 mr-1.5 group-hover:fill-current" /> Square Off All
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse bg-muted/20 border border-border/50 rounded-lg" />
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <div className="border border-dashed border-border/50 rounded-xl p-16 text-center text-muted-foreground bg-card/30 backdrop-blur-sm shadow-sm">
          No strategies found. Create your first strategy to get started!
        </div>
      ) : (
        <div className="space-y-1">
          {strategies
            .map(s => {
              const stratSigs = allSignals.filter(sig => sig.strategy_id === s.id);
              const sorted = [...stratSigs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              const quantity = (s.lot_size || 1) * (s.lot_deploy_qty || 1);
              let profit = 0;
              let active: { type: string; price: number } | null = null;
              sorted.forEach(sig => {
                const sigPrice = Number(sig.price) || 0;
                if (sig.signal_type.startsWith('entry')) {
                  if (sigPrice > 0) {
                    active = { type: sig.signal_type, price: sigPrice };
                  }
                } else if (sig.signal_type.startsWith('exit') && active) {
                  if (sigPrice > 0) {
                    const multiplier = active.type === 'entry_buy' ? 1 : -1;
                    profit += (sigPrice - active.price) * quantity * multiplier;
                    active = null;
                  }
                }
              });
              return { ...s, calculatedProfit: profit };
            })
            .filter(s => {
              if (filterBy === "live") return s.enabled;
              if (filterBy === "stopped") return !s.enabled;
              return true;
            })
            .filter(s => {
              if (!searchQuery) return true;
              return s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.symbol.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => {
              if (sortBy === "name") return a.name.localeCompare(b.name);
              if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              if (sortBy === "status") {
                if (a.enabled === b.enabled) return 0;
                return b.enabled ? -1 : 1;
              }
              if (sortBy === "profit") return b.calculatedProfit - a.calculatedProfit;
              return 0;
            })
            .map((s) => (
              <StrategyRow key={s.id} strategy={s} strategies={strategies} allSignals={allSignals} />
            ))}
        </div>
      )}
    </div>
  );
}
