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


import { Plus, Trash2, Pencil, ChevronRight, Eye, Info, Search, TrendingUp, TrendingDown, Copy, Loader2 } from "lucide-react";

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

const INDEX_OPTIONS = ["NIFTY", "SENSEX", "MIDCAP", "BANKNIFTY", "FINNIFTY"];
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

function StrategyRow({ strategy, strategies }: { strategy: Strategy, strategies: Strategy[] }) {

  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [stockPopoverOpen, setStockPopoverOpen] = useState(false);

  const updateStrategy = useUpdateStrategy();
  const deleteStrategy = useDeleteStrategy();
  const { data: signals = [] } = useSignals({ strategyId: strategy.id, limit: 1 });

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
  let profitValue = 0;
  let tempActive: { type: string; price: number } | null = null;

  sortedSigs.forEach(sig => {
    if (sig.signal_type.startsWith('entry')) {
      tempActive = { type: sig.signal_type, price: Number(sig.price) || 0 };
    } else if (sig.signal_type.startsWith('exit') && tempActive) {
      const exitPrice = Number(sig.price) || 0;
      const multiplier = tempActive.type === 'entry_buy' ? 1 : -1;
      profitValue += (exitPrice - tempActive.price) * quantity * multiplier;
      tempActive = null;
    }
  });

  if (tempActive && currentLtp) {
    const multiplier = tempActive.type === 'entry_buy' ? 1 : -1;
    profitValue += (currentLtp - tempActive.price) * quantity * multiplier;
  }

  useEffect(() => {
    if (isActive && strategy.angelone_token && hasConfig) {
      const timer = setInterval(async () => {
        const val = await getLTP(strategy.symbol, strategy.angelone_token!, strategy.exchange || 'NFO');
        if (val) setCurrentLtp(Number(val));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [isActive, strategy.angelone_token, strategy.symbol, strategy.exchange, hasConfig, getLTP]);

  return (
    <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden mb-2 group">
      <div
        className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate(`/strategies/${strategy.id}`)}
      >

        <div className="flex items-center gap-4 flex-1">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-card-foreground uppercase tracking-wide leading-tight">{strategy.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">

              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Order type :</span>
                <Badge className="bg-primary/20 hover:bg-primary/30 text-primary border-0 text-[10px] h-4 px-1.5 rounded font-semibold uppercase tracking-wider">
                  {strategy.exchange === 'NFO' ? 'F&O' : 'Cash'}
                </Badge>

                <Badge className="bg-muted/50 text-muted-foreground border-0 text-[10px] h-4 px-1.5 rounded font-semibold uppercase tracking-wider">
                  {quantity} QTY
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]'}`} />
                <span className="text-[10px] text-muted-foreground/80 font-medium italic">
                  {isActive ? `Position Open (${lastEntry?.signal_type === 'entry_buy' ? 'BUY' : 'SELL'})` : 'Waiting for Next Entry Signal'}
                </span>
              </div>

            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`text-base font-bold tracking-tight ${profitValue >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {profitValue >= 0 ? `₹ ${profitValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `- ₹ ${Math.abs(profitValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-muted" onClick={(e) => { e.stopPropagation(); navigate(`/strategies/${strategy.id}`); }}>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-muted" title="Webhook URLs" onClick={(e) => e.stopPropagation()}>
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 overflow-hidden bg-card border-border/50" onClick={(e) => e.stopPropagation()}>
                <div className="bg-muted/30 px-4 py-2 border-b border-border/50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Webhook Setup</p>
                </div>
                <div className="p-3 space-y-3">
                  {[
                    { label: "Entry Buy", token: strategy.entry_buy_token },
                    { label: "Entry Sell", token: strategy.entry_sell_token },
                    { label: "Exit Buy", token: strategy.exit_buy_token },
                    { label: "Exit Sell", token: strategy.exit_sell_token },
                  ].map((hook, i) => {
                    const url = hook.token ? getWebhookUrl(hook.token) : "";
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{hook.label}</span>
                          {url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 hover:bg-primary/10 hover:text-primary"
                              onClick={() => {
                                navigator.clipboard.writeText(url);
                                toast.success(`${hook.label} URL copied!`);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <div className="bg-muted/40 p-1.5 rounded border border-border/30 text-[9px] font-mono break-all text-muted-foreground min-h-[30px] flex items-center">
                          {url || "No token set"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>

              </DialogTrigger>
              <DialogContent className="sm:max-w-xl" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                  <DialogTitle>Edit Strategy</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Instrument Type</Label>
                    <Select
                      value={form.symbol && INDEX_OPTIONS.includes(form.symbol) ? "INDEX" : "FUTURE"}
                      onValueChange={(v) => {
                        const newSymbol = v === "INDEX" ? "NIFTY" : FO_STOCKS[0];
                        const prefix = v === "INDEX" ? "IDXFUT" : "STKFUT";
                        const baseName = `${prefix}-${newSymbol}`;
                        const otherNames = strategies.map(s => s.name).filter(n => n !== strategy.name);
                        setForm({ ...form, symbol: newSymbol, name: getUniqueName(baseName, otherNames) });
                      }}

                    >
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDEX">INDEX</SelectItem>
                        <SelectItem value="FUTURE">FUTURE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{(form.symbol && INDEX_OPTIONS.includes(form.symbol)) ? "Select Index" : "Select Stock"}</Label>
                    {(form.symbol && INDEX_OPTIONS.includes(form.symbol)) ? (
                      <Select
                        value={form.symbol}
                        onValueChange={(v) => {
                          const baseName = `IDXFUT-${v}`;
                          const otherNames = strategies.map(s => s.name).filter(n => n !== strategy.name);
                          setForm({ ...form, symbol: v, name: getUniqueName(baseName, otherNames) });
                        }}

                      >
                        <SelectTrigger><SelectValue placeholder="Select Index" /></SelectTrigger>
                        <SelectContent>{INDEX_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Popover open={stockPopoverOpen} onOpenChange={setStockPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                            {form.symbol || "Select Stock"}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search stock..." />
                            <CommandEmpty>No stock found.</CommandEmpty>
                            <CommandList
                              className="max-h-[300px] overflow-y-auto"
                              onWheel={(e) => e.stopPropagation()}
                            >
                              <CommandGroup>
                                {FO_STOCKS.sort().map((stock) => (
                                  <CommandItem
                                    key={stock}
                                    value={stock}
                                    onSelect={(currentValue) => {
                                      const symbol = currentValue.toUpperCase();
                                      const baseName = `STKFUT-${symbol}`;
                                      const otherNames = strategies.map(s => s.name).filter(n => n !== strategy.name);
                                      setForm({ ...form, symbol: symbol, name: getUniqueName(baseName, otherNames) });
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
                  <div className="col-span-2 space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>


                  <div className="col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Size</Label>
                    <Input type="number" value={form.lot_size} onChange={(e) => setForm({ ...form, lot_size: Number(e.target.value) || 1 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lot Deploy Qty</Label>
                    <Input type="number" value={form.lot_deploy_qty} onChange={(e) => setForm({ ...form, lot_deploy_qty: Number(e.target.value) || 1 })} />
                  </div>
                  <div className="col-span-2 space-y-3 mt-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-1">Forward Webhook URLs</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1"><Label className="text-xs">Entry Buy</Label><Input value={form.webhook_url_entry_buy} onChange={(e) => setForm({ ...form, webhook_url_entry_buy: e.target.value })} /></div>
                      <div className="space-y-1"><Label className="text-xs">Entry Sell</Label><Input value={form.webhook_url_entry_sell} onChange={(e) => setForm({ ...form, webhook_url_entry_sell: e.target.value })} /></div>
                      <div className="space-y-1"><Label className="text-xs">Exit Buy</Label><Input value={form.webhook_url_exit_buy} onChange={(e) => setForm({ ...form, webhook_url_exit_buy: e.target.value })} /></div>
                      <div className="space-y-1"><Label className="text-xs">Exit Sell</Label><Input value={form.webhook_url_exit_sell} onChange={(e) => setForm({ ...form, webhook_url_exit_sell: e.target.value })} /></div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button onClick={handleUpdate} disabled={!form.name || !form.symbol}>Update Strategy</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteStrategy.mutate(strategy.id); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>

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
  const { getLTP, findIndexInstrument, findFutureInstrument, hasConfig, isConnecting: angelLoading, isConnected } = useAngelOne();
  const [ltp, setLtp] = useState<number | null>(null);
  const [ltpLabel, setLtpLabel] = useState<string>("");

  const fetchLtp = async (symbol: string, type: "INDEX" | "FUTURE") => {
    setLtp(null);
    setLtpLabel("");
    try {
      // Use proper instrument finder based on type
      const inst = type === "INDEX"
        ? await findIndexInstrument(symbol)   // FUTIDX nearest expiry
        : await findFutureInstrument(symbol); // FUTSTK current month

      if (inst) {
        // Update lot size + token from instrument data
        setForm(prev => ({
          ...prev,
          lot_size: Number(inst.lotsize) || 1,
          angelone_token: inst.token,
          exchange: inst.exch_seg
        }));

        // Build label like "NIFTY FUT 27FEB2026"
        const label = `${inst.name} ${inst.instrumenttype === 'FUTIDX' ? 'FUT' : 'FUT'} ${inst.expiry || ''}`;
        setLtpLabel(label.trim());

        // Fetch real-time LTP
        if (hasConfig) {
          const val = await getLTP(inst.symbol, inst.token, inst.exch_seg);
          if (val) setLtp(Number(val));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch initial LTP and lot size when modal opens
  useEffect(() => {
    if (open && instrumentType === "INDEX") {
      fetchLtp("NIFTY", "INDEX");
    } else if (open && instrumentType === "FUTURE" && FO_STOCKS.length > 0) {
      fetchLtp(form.symbol || FO_STOCKS[0], "FUTURE");
    }
  }, [open, instrumentType]);

  const handleCreate = () => {
    createStrategy.mutate(form, {
      onSuccess: () => {
        setOpen(false);
        setForm({
          name: "", symbol: "", description: "",
          webhook_url_entry_buy: "", webhook_url_entry_sell: "",
          webhook_url_exit_buy: "", webhook_url_exit_sell: "",
          lot_size: 1, lot_deploy_qty: 1, angelone_token: "", exchange: "NFO"
        });
        setLtp(null);
      },
    });
  };

  // Summary Stats
  const { data: allSignals = [] } = useSignals();
  const totalRunCount = allSignals.length;

  // Real P&L calculation logic
  const calculateOverallPL = () => {
    if (!allSignals.length || !strategies.length) return 0;

    // Group signals by strategy
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

      let active: { type: string; price: number } | null = null;
      sorted.forEach(sig => {
        if (sig.signal_type.startsWith('entry')) {
          active = { type: sig.signal_type, price: Number(sig.price) || 0 };
        } else if (sig.signal_type.startsWith('exit') && active) {
          const multiplier = active.type === 'entry_buy' ? 1 : -1;
          total += (Number(sig.price) - active.price) * quantity * multiplier;
          active = null;
        }
      });
    });
    return total;
  };

  const overallProfit = calculateOverallPL();
  const todayProfit = overallProfit / 1.5; // Keeping this simplified for now

  return (
    <div className="space-y-4 max-w-7xl mx-auto py-2 px-4">
      {/* ... Summary stats cards ... */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
            <Info className="h-20 w-20 text-primary" />
          </div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 text-center">Total Run Count</p>
          <p className="text-xl font-bold text-primary text-center tracking-tight">{totalRunCount}</p>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
            {todayProfit >= 0 ? <TrendingUp className="h-20 w-20 text-emerald-500" /> : <TrendingDown className="h-20 w-20 text-rose-500" />}
          </div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 text-center">Today Profit</p>
          <div className="flex flex-col items-center">
            <p className={`text-xl font-bold tracking-tight ${todayProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              ₹ {Math.abs(todayProfit).toLocaleString()}
            </p>
            <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${todayProfit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
              {todayProfit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {todayProfit >= 0 ? "Profit" : "Loss"}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-lg p-3 shadow-sm relative overflow-hidden group">
          <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
            {overallProfit >= 0 ? <TrendingUp className="h-20 w-20 text-emerald-500" /> : <TrendingDown className="h-20 w-20 text-rose-500" />}
          </div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1 text-center">Overall Profit</p>
          <div className="flex flex-col items-center">
            <p className={`text-xl font-bold tracking-tight ${overallProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              ₹ {Math.abs(overallProfit).toLocaleString()}
            </p>
            <div className={`flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${overallProfit >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
              {overallProfit >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {overallProfit >= 0 ? "Profit" : "Loss"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-card-foreground">Strategies</h1>
        <div className="flex items-center gap-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded h-9 px-4 text-sm font-bold uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-2" />New Strategy
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {instrumentType === "INDEX" ? "Select Index" : "Select Stock"}
                  </Label>
                  {instrumentType === "INDEX" ? (
                    <Select value={form.symbol} onValueChange={(v) => {
                      const baseName = `IDXFUT-${v}`;
                      const existingNames = strategies.map(s => s.name);
                      setForm({ ...form, symbol: v, name: getUniqueName(baseName, existingNames) });
                      fetchLtp(v, "INDEX");
                    }}>
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
                          <CommandInput placeholder="Search future stock..." />
                          <CommandEmpty>No stock found.</CommandEmpty>
                          <CommandList
                            className="max-h-[300px] overflow-y-auto"
                            onWheel={(e) => e.stopPropagation()}
                          >
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
          {strategies.map((s) => (
            <StrategyRow key={s.id} strategy={s} strategies={strategies} />
          ))}
        </div>
      )}
    </div>
  );
}
