/**
 * Try all possible Supabase connection endpoints
 */
import pg from 'pg';

const DB_PASSWORD = encodeURIComponent('AC10UIT043@ace');
const PROJECT_REF = 'xdvxqfmrfkhmwbblwmdq';

const ENDPOINTS = [
    // All possible AWS regions for Supabase
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
    // Direct: force IPv4 via family option  
];

const REGIONS = [
    'ap-southeast-1 (Singapore)',
    'ap-south-1 (Mumbai)',
    'ap-northeast-1 (Tokyo)',
    'us-east-1 (N. Virginia)',
    'us-west-1 (N. California)',
    'eu-west-1 (Ireland)',
];

async function main() {
    console.log('=== Testing Supabase Connection Endpoints ===\n');

    for (let i = 0; i < ENDPOINTS.length; i++) {
        console.log(`Testing ${REGIONS[i]}...`);
        const client = new pg.Client({
            connectionString: ENDPOINTS[i],
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            await client.connect();
            console.log(`✅ CONNECTED via ${REGIONS[i]}!`);
            const res = await client.query('SELECT current_database(), version()');
            console.log('DB:', res.rows[0].current_database);
            await client.end();
            console.log(`\nWorking connection string (region ${i}):`);
            console.log(ENDPOINTS[i].replace(DB_PASSWORD, '***'));
            return;
        } catch (e: any) {
            console.log(`   ❌ ${e.message}`);
            try { await client.end(); } catch { }
        }
    }

    // Try direct connection with IPv4 forced
    console.log('\nTrying direct connection with family:4...');
    const directClient = new pg.Client({
        host: `db.${PROJECT_REF}.supabase.co`,
        port: 5432,
        user: 'postgres',
        password: 'AC10UIT043@ace',
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        await directClient.connect();
        console.log('✅ CONNECTED via direct!');
        await directClient.end();
    } catch (e: any) {
        console.log(`   ❌ Direct: ${e.message}`);
        try { await directClient.end(); } catch { }
    }

    console.log('\n❌ Could not connect to any endpoint.');
}

main();
