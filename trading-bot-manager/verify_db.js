import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function verifyDB() {
    const client = new Client({
        connectionString: `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.xdvxqfmrfkhmwbblwmdq.supabase.co:5432/postgres`,
    });

    try {
        await client.connect();
        console.log('Connected to Supabase DB');

        console.log('\n--- Strategies Token Status ---');
        const resStrats = await client.query('SELECT name, symbol, entry_buy_token, enabled FROM strategies LIMIT 5;');
        console.table(resStrats.rows);

        console.log('\n--- Recent Signals (Price Check) ---');
        const resSignals = await client.query('SELECT strategy_id, signal_type, price, source, created_at FROM signals ORDER BY created_at DESC LIMIT 5;');
        console.table(resSignals.rows);

        const zeroPriceCount = await client.query("SELECT COUNT(*) FROM signals WHERE (price = 0 OR price IS NULL) AND source = 'manual';");
        console.log(`\nManual Signals with 0 or NULL price: ${zeroPriceCount.rows[0].count}`);

    } catch (err) {
        console.error('DB Error:', err.message);
    } finally {
        await client.end();
    }
}

verifyDB();
