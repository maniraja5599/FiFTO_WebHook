import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useBrokerSettings, useUpdateBrokerSettings } from "@/hooks/useBrokerSettings";
import {
  Key, User, Lock, ShieldCheck, Save, Loader2, Fingerprint,
  Database, Globe, CheckCircle2, XCircle, RefreshCw, Eye, EyeOff,
  Copy, Wifi, Server, Activity
} from "lucide-react";

/* ─── Shared Components ──────────────────────────────────────── */

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`relative flex h-2.5 w-2.5 ${ok ? "" : ""}`}>
      {ok && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${ok ? "bg-emerald-400" : "bg-red-400"}`} />
    </span>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      className="shrink-0 p-1.5 rounded-md hover:bg-white/5 transition-colors"
      title="Copy"
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground/60" />}
    </button>
  );
}

function SecureInput({ label, icon: Icon, value, onChange, placeholder }: {
  label: string; icon: any; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <div className="relative group">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="bg-white/[0.03] border-white/[0.06] font-mono text-sm h-10 pr-10 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        <button
          onClick={() => setShow(!show)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {show ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}

function ReadonlyField({ label, icon: Icon, value, showCopy = true }: {
  label: string; icon: any; value: string; showCopy?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 px-3 py-2.5 bg-white/[0.02] border border-white/[0.06] rounded-md font-mono text-xs text-muted-foreground/70 truncate select-all">
          {value || "Not configured"}
        </div>
        {showCopy && value && <CopyBtn text={value} />}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: brokerSettings, isLoading: settingsLoading } = useBrokerSettings();
  const updateSettings = useUpdateBrokerSettings();
  const [supabaseOk, setSupabaseOk] = useState(false);
  const [checking, setChecking] = useState(false);

  const [angelForm, setAngelForm] = useState({
    api_key: "NE83ZEA3",
    client_code: "DIYD12021",
    password: "5599",
    secret_key: "c0d75051-0d71-49ba-9401-61f591d263b9",
    totp_secret: "HCGJFJSEZJGFSSX33EN2IMWJGU",
  });

  const sbConfig = {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    id: import.meta.env.VITE_SUPABASE_PROJECT_ID || "",
    anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setEmail(data.user.email || "");
    });
    checkSupabase();
  }, []);

  useEffect(() => {
    if (brokerSettings) {
      setAngelForm({
        api_key: brokerSettings.angelone_api_key || "",
        client_code: brokerSettings.angelone_client_code || "",
        password: brokerSettings.angelone_password || "",
        secret_key: brokerSettings.angelone_secret_key || "",
        totp_secret: brokerSettings.angelone_totp_secret || "",
      });
    }
  }, [brokerSettings]);

  const checkSupabase = async () => {
    setChecking(true);
    try {
      const { error } = await supabase.from("strategies").select("id").limit(1);
      setSupabaseOk(!error);
    } catch { setSupabaseOk(false); }
    setChecking(false);
  };

  const handleSaveAngelOne = () => {
    updateSettings.mutate({
      angelone_api_key: angelForm.api_key,
      angelone_client_code: angelForm.client_code,
      angelone_password: angelForm.password,
      angelone_secret_key: angelForm.secret_key,
      angelone_totp_secret: angelForm.totp_secret,
    });
  };

  const maskedKey = (k: string) => k.length > 16 ? k.slice(0, 10) + "•••" + k.slice(-6) : k;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Account, broker & database configurations
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="angelone" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-12 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 gap-1">
          <TabsTrigger
            value="angelone"
            className="rounded-lg font-bold text-xs tracking-wide data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 data-[state=active]:border data-[state=active]:shadow-sm transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
            Angel One
          </TabsTrigger>
          <TabsTrigger
            value="supabase"
            className="rounded-lg font-bold text-xs tracking-wide data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-400 data-[state=active]:border-orange-500/30 data-[state=active]:border data-[state=active]:shadow-sm transition-all"
          >
            <Database className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
            Database
          </TabsTrigger>
          <TabsTrigger
            value="market"
            className="rounded-lg font-bold text-xs tracking-wide data-[state=active]:bg-violet-500/15 data-[state=active]:text-violet-400 data-[state=active]:border-violet-500/30 data-[state=active]:border data-[state=active]:shadow-sm transition-all"
          >
            <Wifi className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
            Market
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="rounded-lg font-bold text-xs tracking-wide data-[state=active]:bg-blue-500/15 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/30 data-[state=active]:border data-[state=active]:shadow-sm transition-all"
          >
            <User className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ ANGEL ONE TAB ═══════════════ */}
        <TabsContent value="angelone" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <Card className="border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent shadow-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-emerald-400">Angel One SmartAPI</CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">Real-time market data & automated trading</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <StatusDot ok={!!brokerSettings?.angelone_api_key} />
                  <span className="font-semibold">{brokerSettings?.angelone_api_key ? "Configured" : "Not set"}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Client ID
                  </Label>
                  <Input
                    value={angelForm.client_code}
                    onChange={(e) => setAngelForm({ ...angelForm, client_code: e.target.value })}
                    placeholder="e.g. DIYD12021"
                    className="bg-white/[0.03] border-white/[0.06] font-mono text-sm h-10 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 flex items-center gap-1.5">
                    <Key className="h-3 w-3" /> API Key
                  </Label>
                  <Input
                    value={angelForm.api_key}
                    onChange={(e) => setAngelForm({ ...angelForm, api_key: e.target.value })}
                    placeholder="SmartAPI App Key"
                    className="bg-white/[0.03] border-white/[0.06] font-mono text-sm h-10 focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20"
                  />
                </div>
                <SecureInput label="MPIN" icon={Lock} value={angelForm.password}
                  onChange={(v) => setAngelForm({ ...angelForm, password: v })} placeholder="Trading PIN" />
                <SecureInput label="Secret Key" icon={Fingerprint} value={angelForm.secret_key}
                  onChange={(v) => setAngelForm({ ...angelForm, secret_key: v })} placeholder="API Secret Key" />
              </div>
              <SecureInput label="TOTP Key" icon={ShieldCheck} value={angelForm.totp_secret}
                onChange={(v) => setAngelForm({ ...angelForm, totp_secret: v })} placeholder="Base32 TOTP secret from enable-totp page" />

              <div className="pt-5 border-t border-white/[0.04] flex justify-end">
                <Button onClick={handleSaveAngelOne} disabled={updateSettings.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-widest h-11 px-8 shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all">
                  {updateSettings.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ SUPABASE TAB ═══════════════ */}
        <TabsContent value="supabase" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <Card className="border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent shadow-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <Database className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black text-orange-400">Supabase Database</CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">Backend database & API connection</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot ok={supabaseOk} />
                  <span className="text-xs font-semibold text-muted-foreground/60">
                    {supabaseOk ? "Connected" : "Disconnected"}
                  </span>
                  <button onClick={checkSupabase} disabled={checking}
                    className="p-1.5 rounded-lg hover:bg-white/5 border border-white/[0.06] transition-colors" title="Test">
                    <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground/50 ${checking ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <ReadonlyField label="Project URL" icon={Globe} value={sbConfig.url} />
              <ReadonlyField label="Project ID" icon={Server} value={sbConfig.id} />
              <ReadonlyField label="Anon Public Key" icon={Key} value={maskedKey(sbConfig.anonKey)} />

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] mt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="font-bold">Config Source:</span>
                  <code className="bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded font-bold text-[10px]">.env</code>
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5">
                  Update <code className="bg-white/5 px-1 rounded">.env</code> and restart the dev server to change Supabase credentials.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ MARKET DATA TAB ═══════════════ */}
        <TabsContent value="market" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <Card className="border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent shadow-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <Wifi className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-violet-400">Market Data Sync</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">NSE/NFO symbols & lot sizes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-4">
                {[
                  { n: 1, title: "Sync Symbol Master", desc: "Downloads latest instrument data from Angel One" },
                  { n: 2, title: "Auto Lot Sizes", desc: "NIFTY (75), BANKNIFTY (30) and all F&O stocks" },
                  { n: 3, title: "Real-time LTP", desc: "Live prices fetched when creating strategies" },
                ].map((item) => (
                  <div key={item.n} className="flex items-start gap-3.5 p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                    <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <span className="text-violet-400 font-black text-xs">{item.n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground/90">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/[0.04]">
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <p className="text-xs font-bold text-violet-300 mb-2">Terminal Command</p>
                  <div className="flex items-center gap-2 bg-black/40 rounded-lg px-3 py-2.5 font-mono text-sm text-violet-300">
                    <span className="text-muted-foreground/40">$</span>
                    <span>npm run sync</span>
                    <div className="ml-auto"><CopyBtn text="npm run sync" /></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ ACCOUNT TAB ═══════════════ */}
        <TabsContent value="account" className="mt-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <Card className="border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent shadow-2xl overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <User className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-blue-400">Account Settings</CardTitle>
                  <CardDescription className="text-[11px] mt-0.5">Login credentials & account management</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">Email Address</Label>
                <Input value={email} disabled className="bg-white/[0.02] border-white/[0.06] text-muted-foreground/50 font-mono text-sm" />
              </div>

              <div className="pt-4 border-t border-white/[0.04] flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => {
                  const p = prompt("Enter new password:");
                  if (!p) return;
                  setLoading(true);
                  supabase.auth.updateUser({ password: p }).then(({ error }) => {
                    error ? toast.error(error.message) : toast.success("Password updated!");
                    setLoading(false);
                  });
                }} disabled={loading}
                  className="font-bold text-[11px] uppercase tracking-wider border-white/[0.08] hover:bg-white/5 h-10 px-5">
                  <Lock className="h-3.5 w-3.5 mr-1.5" /> Change Password
                </Button>
                <Button variant="destructive" onClick={() => { supabase.auth.signOut(); window.location.reload(); }}
                  className="font-bold text-[11px] uppercase tracking-wider h-10 px-5 shadow-lg shadow-red-500/10">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center mt-10">
        <p className="text-[10px] text-muted-foreground/30 font-medium tracking-widest uppercase">
          FiFTO SignalHub v1.0
        </p>
      </div>
    </div>
  );
}
