import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const MSL_URL = 'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json';
const OUTPUT_FILE = path.join(process.cwd(), 'public/data/instruments.json');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

async function syncSymbols() {
    console.log('Fetching Angel One Master Symbol List...');
    try {
        const response = await fetch(MSL_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log(`Total symbols fetched: ${data.length}`);

        // Filter for relevant symbols
        const filtered = data.filter((item: any) => {
            const isNFO = item.exch_seg === 'NFO';
            const isBFO = item.exch_seg === 'BFO';
            // Only keep Futures for NFO/BFO to keep file size small
            const isFuture = item.instrumenttype === 'FUTIDX' || item.instrumenttype === 'FUTSTK';

            const isIndex = (item.exch_seg === 'NSE' || item.exch_seg === 'BSE') && (
                item.symbol === 'NIFTY' ||
                item.symbol === 'BANKNIFTY' ||
                item.symbol === 'FINNIFTY' ||
                item.symbol === 'MIDCPNIFTY' ||
                item.symbol === 'SENSEX' ||
                item.symbol === 'BANKEX'
            );
            return (isNFO && isFuture) || (isBFO && isFuture) || isIndex;
        }).map((item: any) => ({
            token: item.token,
            symbol: item.symbol,
            name: item.name,
            expiry: item.expiry,
            lotsize: item.lotsize,
            exch_seg: item.exch_seg,
            instrumenttype: item.instrumenttype
        }));

        console.log(`Filtered symbols: ${filtered.length}`);

        // Save locally as fallback
        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(filtered, null, 2));
        console.log(`Successfully saved symbols to ${OUTPUT_FILE}`);

        // Push to Supabase if available
        if (supabase) {
            console.log('Pushing to Supabase instrument_master...');
            // Process in chunks to avoid payload size limits
            const chunkSize = 500;
            for (let i = 0; i < filtered.length; i += chunkSize) {
                const chunk = filtered.slice(i, i + chunkSize);
                const { error } = await supabase
                    .from('instrument_master')
                    .upsert(chunk, { onConflict: 'token' });

                if (error) {
                    console.error(`Error pushing chunk ${i / chunkSize}:`, error.message);
                } else {
                    console.log(`Pushed chunk ${i / chunkSize + 1}/${Math.ceil(filtered.length / chunkSize)}`);
                }
            }
            console.log('Successfully synced with Supabase');
        }
    } catch (error) {
        console.error('Error syncing symbols:', error);
    }
}

syncSymbols();
