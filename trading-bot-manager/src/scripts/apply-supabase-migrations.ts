/**
 * Apply all migrations to the new Supabase project
 */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const DB_PASSWORD = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD || 'AC10UIT043@ace');

// Try multiple connection string formats
const CONNECTION_STRINGS = [
    // Direct connection (from user)
    `postgresql://postgres:${DB_PASSWORD}@db.xdvxqfmrfkhmwbblwmdq.supabase.co:5432/postgres`,
    // Transaction pooler
    `postgresql://postgres.xdvxqfmrfkhmwbblwmdq:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    // Session pooler
    `postgresql://postgres.xdvxqfmrfkhmwbblwmdq:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
];

const MIGRATIONS_SQL = `
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.broker_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    angelone_api_key TEXT,
    angelone_client_code TEXT,
    angelone_password TEXT,
    angelone_totp_secret TEXT,
    angelone_secret_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);
ALTER TABLE public.broker_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own broker settings" ON public.broker_settings;
DROP POLICY IF EXISTS "Users can insert their own broker settings" ON public.broker_settings;
DROP POLICY IF EXISTS "Users can update their own broker settings" ON public.broker_settings;
CREATE POLICY "Users can view their own broker settings" ON public.broker_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own broker settings" ON public.broker_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own broker settings" ON public.broker_settings FOR UPDATE USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS update_broker_settings_updated_at ON public.broker_settings;
CREATE TRIGGER update_broker_settings_updated_at BEFORE UPDATE ON public.broker_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.strategies (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    stock TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'LONG',
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active',
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own strategies" ON public.strategies;
DROP POLICY IF EXISTS "Users can insert their own strategies" ON public.strategies;
DROP POLICY IF EXISTS "Users can update their own strategies" ON public.strategies;
DROP POLICY IF EXISTS "Users can delete their own strategies" ON public.strategies;
CREATE POLICY "Users can view their own strategies" ON public.strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own strategies" ON public.strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own strategies" ON public.strategies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own strategies" ON public.strategies FOR DELETE USING (auth.uid() = user_id);
DROP TRIGGER IF EXISTS update_strategies_updated_at ON public.strategies;
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id TEXT REFERENCES public.strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    price NUMERIC DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    response_code INTEGER DEFAULT 0,
    response_body TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    source TEXT DEFAULT 'webhook',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own signals" ON public.signals;
DROP POLICY IF EXISTS "Users can insert signals" ON public.signals;
CREATE POLICY "Users can view their own signals" ON public.signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert signals" ON public.signals FOR INSERT WITH CHECK (true);
DROP TRIGGER IF EXISTS update_signals_updated_at ON public.signals;
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.instrument_master (
    token TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    expiry TEXT,
    lotsize TEXT,
    exch_seg TEXT NOT NULL,
    instrumenttype TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.instrument_master ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.instrument_master;
DROP POLICY IF EXISTS "Allow anon upsert" ON public.instrument_master;
CREATE POLICY "Allow public read access" ON public.instrument_master FOR SELECT USING (true);
CREATE POLICY "Allow anon upsert" ON public.instrument_master FOR ALL USING (true) WITH CHECK (true);
`;

async function main() {
    console.log('=== Applying Supabase Migrations ===\n');

    for (let i = 0; i < CONNECTION_STRINGS.length; i++) {
        const connStr = CONNECTION_STRINGS[i];
        const label = ['Direct', 'Transaction Pooler', 'Session Pooler'][i];
        console.log(`Attempt ${i + 1}/3 (${label})...`);

        const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

        try {
            await client.connect();
            console.log('✅ Connected!\n');

            console.log('Running migrations...');
            await client.query(MIGRATIONS_SQL);
            console.log('✅ All migrations applied!\n');

            // Verify
            const result = await client.query(`
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            `);

            console.log('📋 Tables created:');
            result.rows.forEach(row => console.log(`   ✅ ${row.table_name}`));

            await client.end();
            console.log('\n🎉 Database setup complete!');
            return;
        } catch (error: any) {
            console.log(`   ❌ Failed: ${error.message}\n`);
            try { await client.end(); } catch { }
        }
    }

    console.log('All connection attempts failed.');
    console.log('The project might still be initializing. Please wait 2 minutes and try again.');
}

main();
