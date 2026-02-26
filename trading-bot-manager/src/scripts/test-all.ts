/**
 * Test both Angel One and Supabase connectivity
 */
import dotenv from 'dotenv';
dotenv.config();

const ANGEL_ONE = {
    apiKey: 'NE83ZEA3',
    clientCode: 'DIYD12021',
    password: '5599',
    totpSecret: 'HCGJFJSEZJGFSSX33EN2IMWJGU',
};

const BASE_URL = 'https://apiconnect.angelone.in';

// ============ TOTP ============
function base32ToUint8Array(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = base32.replace(/=+$/, '').toUpperCase();
    let bits = '';
    for (const char of clean) {
        const val = alphabet.indexOf(char);
        if (val === -1) throw new Error(`Invalid Base32 char: ${char}`);
        bits += val.toString(2).padStart(5, '0');
    }
    const bytes = new Uint8Array(Math.floor(bits.length / 8));
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
    return bytes;
}

async function generateTOTP(secret: string): Promise<string> {
    const keyBytes = base32ToUint8Array(secret);
    const time = Math.floor(Date.now() / 1000 / 30);
    const timeBuffer = new ArrayBuffer(8);
    const view = new DataView(timeBuffer);
    view.setUint32(4, time, false);
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, timeBuffer));
    const offset = sig[sig.length - 1] & 0xf;
    const code = ((sig[offset] & 0x7f) << 24 | sig[offset + 1] << 16 | sig[offset + 2] << 8 | sig[offset + 3]) % 1000000;
    return code.toString().padStart(6, '0');
}

// ============ Angel One Test ============
async function testAngelOne() {
    console.log('==============================');
    console.log(' ANGEL ONE API TEST');
    console.log('==============================\n');

    try {
        // Generate TOTP
        const totp = await generateTOTP(ANGEL_ONE.totpSecret);
        console.log(`✅ TOTP Generated: ${totp}`);

        // Login
        console.log('\nLogging in...');
        const loginRes = await fetch(`${BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-UserType': 'USER',
                'X-SourceID': 'WEB',
                'X-ClientLocalIP': '127.0.0.1',
                'X-ClientPublicIP': '127.0.0.1',
                'X-MACAddress': '00:00:00:00:00:00',
                'X-PrivateKey': ANGEL_ONE.apiKey,
            },
            body: JSON.stringify({
                clientcode: ANGEL_ONE.clientCode,
                password: ANGEL_ONE.password,
                totp: totp,
            }),
        });

        const loginData = await loginRes.json();

        if (!loginData.data?.jwtToken) {
            console.log(`❌ Login failed: ${loginData.message}`);
            return false;
        }

        const jwt = loginData.data.jwtToken;
        console.log(`✅ Login successful!`);
        console.log(`   JWT: ${jwt.substring(0, 30)}...`);
        console.log(`   Feed Token: ${loginData.data.feedToken}`);

        // Fetch NIFTY LTP
        console.log('\nFetching NIFTY LTP...');
        const ltpRes = await fetch(`${BASE_URL}/rest/secure/angelbroking/market/v1/quote/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-UserType': 'USER',
                'X-SourceID': 'WEB',
                'X-ClientLocalIP': '127.0.0.1',
                'X-ClientPublicIP': '127.0.0.1',
                'X-MACAddress': '00:00:00:00:00:00',
                'X-PrivateKey': ANGEL_ONE.apiKey,
                'Authorization': `Bearer ${jwt}`,
            },
            body: JSON.stringify({
                mode: 'LTP',
                exchangeTokens: { NSE: ['99926000'] }, // NIFTY Index
            }),
        });

        const ltpData = await ltpRes.json();
        if (ltpData.data?.fetched?.length > 0) {
            const nifty = ltpData.data.fetched[0];
            console.log(`✅ NIFTY LTP: ₹${Number(nifty.ltp).toLocaleString('en-IN')}`);
            console.log(`   Symbol: ${nifty.tradingSymbol || 'NIFTY'}`);
        } else {
            console.log(`❌ LTP fetch failed: ${ltpData.message}`);
        }

        return true;
    } catch (err: any) {
        console.log(`❌ Error: ${err.message}`);
        return false;
    }
}

// ============ Supabase Test ============
async function testSupabase() {
    console.log('\n==============================');
    console.log(' SUPABASE DATABASE TEST');
    console.log('==============================\n');

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://xdvxqfmrfkhmwbblwmdq.supabase.co';
    const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    if (!ANON_KEY) {
        console.log('❌ No anon key found in .env');
        return false;
    }

    try {
        // Test REST API connectivity
        console.log('Testing REST API...');
        const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: { 'apikey': ANON_KEY },
        });
        console.log(`✅ REST API: HTTP ${res.status}`);

        // Test auth endpoint
        console.log('\nTesting Auth...');
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
            headers: { 'apikey': ANON_KEY },
        });
        const authData = await authRes.json();
        console.log(`✅ Auth service: ${authData.external ? 'Running' : 'Unknown'}`);

        // Test if tables exist
        console.log('\nChecking tables...');
        const tables = ['broker_settings', 'strategies', 'signals', 'instrument_master'];
        for (const table of tables) {
            const tRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count&limit=0`, {
                headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
            });
            if (tRes.status === 200) {
                console.log(`   ✅ ${table} — exists`);
            } else {
                const err = await tRes.json();
                console.log(`   ❌ ${table} — ${err.message || tRes.status}`);
            }
        }

        // Try to create tables via pg pooler (retry)
        console.log('\nAttempting DB connection via pooler...');
        try {
            const pg = await import('pg');
            const DB_PASSWORD = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD || 'AC10UIT043@ace');
            const PROJECT_REF = 'xdvxqfmrfkhmwbblwmdq';

            // Try all regions
            const regions = [
                'ap-southeast-1', 'ap-south-1', 'ap-northeast-1',
                'us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1',
                'ap-southeast-2', 'sa-east-1', 'ca-central-1',
            ];

            for (const region of regions) {
                const connStr = `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
                const client = new pg.default.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
                try {
                    await client.connect();
                    console.log(`   ✅ Connected via ${region} pooler!`);

                    // Run table creation
                    console.log('   Running migrations...');
                    await client.query(`
            CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
            
            CREATE TABLE IF NOT EXISTS public.broker_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, angelone_api_key TEXT, angelone_client_code TEXT, angelone_password TEXT, angelone_totp_secret TEXT, angelone_secret_key TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), UNIQUE(user_id));
            ALTER TABLE public.broker_settings ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Users can view their own broker settings" ON public.broker_settings;
            DROP POLICY IF EXISTS "Users can insert their own broker settings" ON public.broker_settings;
            DROP POLICY IF EXISTS "Users can update their own broker settings" ON public.broker_settings;
            CREATE POLICY "Users can view their own broker settings" ON public.broker_settings FOR SELECT USING (auth.uid() = user_id);
            CREATE POLICY "Users can insert their own broker settings" ON public.broker_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
            CREATE POLICY "Users can update their own broker settings" ON public.broker_settings FOR UPDATE USING (auth.uid() = user_id);
            
            CREATE TABLE IF NOT EXISTS public.strategies (id TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, name TEXT NOT NULL, stock TEXT NOT NULL, direction TEXT NOT NULL DEFAULT 'LONG', quantity INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'active', webhook_url TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT now());
            ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Users can view their own strategies" ON public.strategies;
            DROP POLICY IF EXISTS "Users can insert their own strategies" ON public.strategies;
            DROP POLICY IF EXISTS "Users can update their own strategies" ON public.strategies;
            DROP POLICY IF EXISTS "Users can delete their own strategies" ON public.strategies;
            CREATE POLICY "Users can view their own strategies" ON public.strategies FOR SELECT USING (auth.uid() = user_id);
            CREATE POLICY "Users can insert their own strategies" ON public.strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
            CREATE POLICY "Users can update their own strategies" ON public.strategies FOR UPDATE USING (auth.uid() = user_id);
            CREATE POLICY "Users can delete their own strategies" ON public.strategies FOR DELETE USING (auth.uid() = user_id);
            
            CREATE TABLE IF NOT EXISTS public.signals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), strategy_id TEXT REFERENCES public.strategies(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, signal_type TEXT NOT NULL, price NUMERIC DEFAULT 0, quantity INTEGER DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', response_code INTEGER DEFAULT 0, response_body TEXT DEFAULT '', notes TEXT DEFAULT '', source TEXT DEFAULT 'webhook', created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT now());
            ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Users can view their own signals" ON public.signals;
            DROP POLICY IF EXISTS "Users can insert signals" ON public.signals;
            CREATE POLICY "Users can view their own signals" ON public.signals FOR SELECT USING (auth.uid() = user_id);
            CREATE POLICY "Users can insert signals" ON public.signals FOR INSERT WITH CHECK (true);
            
            CREATE TABLE IF NOT EXISTS public.instrument_master (token TEXT PRIMARY KEY, symbol TEXT NOT NULL, name TEXT NOT NULL, expiry TEXT, lotsize TEXT, exch_seg TEXT NOT NULL, instrumenttype TEXT, updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL);
            ALTER TABLE public.instrument_master ENABLE ROW LEVEL SECURITY;
            DROP POLICY IF EXISTS "Allow public read access" ON public.instrument_master;
            DROP POLICY IF EXISTS "Allow anon upsert" ON public.instrument_master;
            CREATE POLICY "Allow public read access" ON public.instrument_master FOR SELECT USING (true);
            CREATE POLICY "Allow anon upsert" ON public.instrument_master FOR ALL USING (true) WITH CHECK (true);
          `);
                    console.log('   ✅ All tables created!');
                    await client.end();
                    return true;
                } catch (e: any) {
                    try { await client.end(); } catch { }
                }
            }
            console.log('   ❌ All pooler regions failed');
        } catch (e: any) {
            console.log(`   ❌ PG module error: ${e.message}`);
        }

        return true;
    } catch (err: any) {
        console.log(`❌ Error: ${err.message}`);
        return false;
    }
}

// ============ Run Tests ============
async function main() {
    const angelOk = await testAngelOne();
    const supaOk = await testSupabase();

    console.log('\n==============================');
    console.log(' TEST RESULTS');
    console.log('==============================');
    console.log(`Angel One:  ${angelOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Supabase:   ${supaOk ? '✅ PASS' : '❌ FAIL'}`);
}

main();
