import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useBrokerSettings } from '@/hooks/useBrokerSettings';
import { AngelOneClient } from '@/lib/angelone-utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/* ─── Types ─── */
export type Instrument = {
    token: string;
    symbol: string;
    name: string;
    expiry: string;
    lotsize: string;
    instrumenttype: string;
    exch_seg: string;
};

type AngelOneContextType = {
    isConnected: boolean;
    isConnecting: boolean;
    dbConnected: boolean;
    session: any;
    client: AngelOneClient | null;
    login: () => Promise<any>;
    getLTP: (symbol: string, token: string, exchange?: string) => Promise<number | null>;
    getMultipleLTP: (instruments: { symbol: string; token: string; exchange: string }[]) => Promise<Record<string, number>>;
    findInstrument: (symbol: string, exch?: string) => Promise<Instrument | null>;
    findIndexInstrument: (symbol: string) => Promise<Instrument | null>;
    findFutureInstrument: (symbol: string) => Promise<Instrument | null>;
    fetchMSL: () => Promise<Instrument[]>;
    hasConfig: boolean;
};

const AngelOneContext = createContext<AngelOneContextType | null>(null);

/* ─── MSL Cache ─── */
let cachedMSL: Instrument[] | null = null;
let mslPromise: Promise<Instrument[]> | null = null;

/* ─── Provider ─── */
export function AngelOneProvider({ children }: { children: React.ReactNode }) {
    const { data: settings, isLoading: settingsLoading } = useBrokerSettings();
    const [session, setSession] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [dbConnected, setDbConnected] = useState(false);
    const autoLoginAttempted = useRef(false);

    // Build client from saved settings
    const client = useMemo(() => {
        if (!settings?.angelone_api_key || !settings?.angelone_client_code ||
            !settings?.angelone_password || !settings?.angelone_totp_secret) {
            return null;
        }
        return new AngelOneClient(
            settings.angelone_api_key,
            settings.angelone_client_code,
            settings.angelone_password,
            settings.angelone_totp_secret
        );
    }, [settings]);

    const hasConfig = !!client;

    // Login function
    const login = useCallback(async () => {
        if (!client) return null;
        setIsConnecting(true);
        try {
            const data = await client.login();
            setSession(data);
            return data;
        } catch (e: any) {
            console.error('Angel One login error:', e.message);
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [client]);

    // AUTO-CONNECT: Login to Angel One + check DB on app start
    useEffect(() => {
        if (settingsLoading || autoLoginAttempted.current) return;
        autoLoginAttempted.current = true;

        // Check Supabase DB
        (async () => {
            try {
                const { error } = await supabase.from('strategies').select('id').limit(1);
                setDbConnected(!error);
                if (!error) console.log('✅ Supabase DB connected');
                else console.warn('⚠️ Supabase DB issue:', error.message);
            } catch { setDbConnected(false); }
        })();

        // Auto-login to Angel One
        if (client) {
            (async () => {
                setIsConnecting(true);
                try {
                    const data = await client.login();
                    setSession(data);
                    console.log('✅ Angel One auto-connected');
                    toast.success('Angel One connected', { duration: 2000 });
                } catch (e: any) {
                    console.warn('⚠️ Angel One auto-connect failed:', e.message);
                } finally {
                    setIsConnecting(false);
                }
            })();
        }
    }, [client, settingsLoading]);

    // Fetch Master Symbol List from Supabase -> fallback to local -> fallback to API
    const fetchMSL = useCallback(async (): Promise<Instrument[]> => {
        if (cachedMSL) return cachedMSL;
        if (mslPromise) return mslPromise;

        mslPromise = (async () => {
            try {
                // @ts-ignore
                const { data, error } = await supabase.from('instrument_master').select('*');
                if (!error && data && data.length > 0) {
                    cachedMSL = data as unknown as Instrument[];
                    console.log(`📊 Loaded ${cachedMSL.length} instruments from Supabase`);
                } else {
                    console.warn('Supabase MSL empty, trying local JSON...');
                    const response = await fetch('/data/instruments.json');
                    const localData = await response.json();
                    cachedMSL = localData as Instrument[];
                }
                return cachedMSL!;
            } catch (e: any) {
                try {
                    const response = await fetch('/data/instruments.json');
                    cachedMSL = (await response.json()) as Instrument[];
                    return cachedMSL;
                } catch { return []; }
            } finally {
                mslPromise = null;
            }
        })();

        return mslPromise;
    }, []);

    // Date parser for expiry sorting
    const parseDate = (d: string) => {
        if (!d) return 0;
        if (d.length === 9) {
            // DDMMMYYYY format like "26FEB2026"
            const day = d.substring(0, 2);
            const month = d.substring(2, 5);
            const year = d.substring(5);
            return new Date(`${day} ${month} ${year}`).getTime() || 0;
        }
        return new Date(d).getTime() || 0;
    };

    // Find nearest futures contract for an INDEX (FUTIDX)
    const findIndexInstrument = useCallback(async (symbol: string): Promise<Instrument | null> => {
        const list = await fetchMSL();
        if (!list.length) return null;

        // For indexes, find FUTIDX with nearest expiry
        const now = Date.now();
        const potential = list.filter(i =>
            i.name === symbol &&
            i.exch_seg === 'NFO' &&
            i.instrumenttype === 'FUTIDX' &&
            parseDate(i.expiry) >= now
        );

        if (potential.length > 0) {
            return potential.sort((a, b) => parseDate(a.expiry) - parseDate(b.expiry))[0];
        }

        // Fallback: any FUTIDX for this symbol
        const fallback = list.filter(i =>
            i.name === symbol && i.exch_seg === 'NFO' && i.instrumenttype === 'FUTIDX'
        ).sort((a, b) => parseDate(a.expiry) - parseDate(b.expiry));

        return fallback[0] || null;
    }, [fetchMSL]);

    // Find nearest futures contract for a STOCK (FUTSTK)
    const findFutureInstrument = useCallback(async (symbol: string): Promise<Instrument | null> => {
        const list = await fetchMSL();
        if (!list.length) return null;

        const now = Date.now();
        const potential = list.filter(i =>
            i.name === symbol &&
            i.exch_seg === 'NFO' &&
            i.instrumenttype === 'FUTSTK' &&
            parseDate(i.expiry) >= now
        );

        if (potential.length > 0) {
            return potential.sort((a, b) => parseDate(a.expiry) - parseDate(b.expiry))[0];
        }

        // Fallback
        const fallback = list.filter(i =>
            i.name === symbol && i.exch_seg === 'NFO' && i.instrumenttype === 'FUTSTK'
        ).sort((a, b) => parseDate(a.expiry) - parseDate(b.expiry));

        return fallback[0] || null;
    }, [fetchMSL]);

    // Generic find instrument (backward compat)
    const findInstrument = useCallback(async (symbol: string, exch: string = 'NFO'): Promise<Instrument | null> => {
        const list = await fetchMSL();
        if (!list.length) return null;

        let found = list.find(i => i.symbol === symbol && i.exch_seg === exch);

        if ((!found || symbol === 'NIFTY' || symbol === 'BANKNIFTY') && exch === 'NFO') {
            const potential = list.filter(i =>
                i.name === symbol && i.exch_seg === 'NFO' &&
                (i.instrumenttype === 'FUTIDX' || i.instrumenttype === 'FUTSTK')
            );
            if (potential.length > 0) {
                found = potential.sort((a, b) => parseDate(a.expiry) - parseDate(b.expiry))[0];
            }
        }

        return found || null;
    }, [fetchMSL]);

    // Get LTP with auto-login
    const getLTP = useCallback(async (symbol: string, token: string, exchange: string = 'NFO'): Promise<number | null> => {
        if (!client) return null;
        let s = session;
        if (!s) {
            s = await login();
            if (!s) return null;
        }

        try {
            const data = await client.getLTP(s.jwtToken, symbol, token, exchange);
            return data?.fetched?.[0]?.ltp ? Number(data.fetched[0].ltp) : (data?.[0]?.ltp ? Number(data[0].ltp) : null);
        } catch (e: any) {
            if (e.message?.includes('expired') || e.message?.includes('token') || e.message?.includes('Invalid')) {
                const newS = await login();
                if (newS) {
                    const data = await client.getLTP(newS.jwtToken, symbol, token, exchange);
                    return data?.fetched?.[0]?.ltp ? Number(data.fetched[0].ltp) : (data?.[0]?.ltp ? Number(data[0].ltp) : null);
                }
            }
            return null;
        }
    }, [client, session, login]);

    // Batch LTP
    const getMultipleLTP = useCallback(async (instruments: { symbol: string; token: string; exchange: string }[]): Promise<Record<string, number>> => {
        if (!client || !instruments.length) return {};
        let s = session;
        if (!s) { s = await login(); if (!s) return {}; }

        try {
            const grouped = instruments.reduce((acc, inst) => {
                if (!acc[inst.exchange]) acc[inst.exchange] = [];
                acc[inst.exchange].push(inst.token);
                return acc;
            }, {} as Record<string, string[]>);

            const results: Record<string, number> = {};
            for (const [exch, tokens] of Object.entries(grouped)) {
                const data = await client.getLTP(s.jwtToken, "", tokens.join(","), exch);
                const items = data?.fetched || data || [];
                if (Array.isArray(items)) {
                    items.forEach((item: any) => {
                        if (item.ltp) results[item.tradingSymbol || item.token] = Number(item.ltp);
                    });
                }
            }
            return results;
        } catch { return {}; }
    }, [client, session, login]);

    const value: AngelOneContextType = {
        isConnected: !!session,
        isConnecting,
        dbConnected,
        session,
        client,
        login,
        getLTP,
        getMultipleLTP,
        findInstrument,
        findIndexInstrument,
        findFutureInstrument,
        fetchMSL,
        hasConfig,
    };

    return (
        <AngelOneContext.Provider value={value}>
            {children}
        </AngelOneContext.Provider>
    );
}

/* ─── Hook ─── */
export function useAngelOne() {
    const context = useContext(AngelOneContext);
    if (!context) {
        throw new Error('useAngelOne must be used within AngelOneProvider');
    }
    return context;
}

// Backward compatibility
export function useAngelOneData() {
    const ctx = useAngelOne();
    return {
        login: ctx.login,
        getLTP: ctx.getLTP,
        getMultipleLTP: ctx.getMultipleLTP,
        findInstrument: ctx.findInstrument,
        fetchMSL: ctx.fetchMSL,
        loading: ctx.isConnecting,
        hasConfig: ctx.hasConfig,
        session: ctx.session,
    };
}
