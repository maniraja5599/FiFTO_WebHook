import fs from 'fs';
import path from 'path';

const files = [
    { name: 'CASH MACHINE', path: './temp_uploads/CASH MACHINE.csv' },
    { name: 'DIR NIF 10030', path: './temp_uploads/DIR NIF 10030.csv' },
    { name: 'INCOME INT SELL', path: './temp_uploads/INCOME INT SELL.csv' }
];

const strategies = [];

function parseCSV(content) {
    const lines = content.trim().split('\n');
    const headers = lines[0].trim().split(',').map(h => h.trim());

    // Helper to find index
    const getIdx = (patterns) => headers.findIndex(h => patterns.some(p => h.includes(p)));

    const idxEntryTime = getIdx(['Entry Time', 'Entry Date', 'Date']);
    const idxExitTime = getIdx(['Exit Time', 'Exit Date']);
    // const idxInstrument = getIdx(['Instrument', 'Symbol']); // Not strictly needed for logic but good to have
    const idxProfit = getIdx(['Profit', 'P&L', 'PnL']);

    const trades = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].trim().split(','); // Simple split, assuming no commas in fields for now
        if (row.length < headers.length) continue;

        const profit = parseFloat(row[idxProfit]);
        if (isNaN(profit)) continue;

        trades.push({
            entryTime: row[idxEntryTime],
            exitTime: row[idxExitTime],
            profit: profit,
            // Add other fields if needed for display, but StatsGrid mainly needs profit & times
            instrument: row[1], // Assuming 2nd column
            original: {} // Minimal to save space
        });
    }
    return trades;
}

files.forEach(file => {
    try {
        const content = fs.readFileSync(file.path, 'utf8');
        const trades = parseCSV(content);
        strategies.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            trades: trades,
            selected: true
        });
        console.log(`Processed ${file.name}: ${trades.length} trades`);
    } catch (e) {
        console.error(`Error processing ${file.name}:`, e.message);
    }
});

const portfolio = [{
    name: 'Combined Analysis (Auto-Loaded)',
    strategies: strategies,
    date: new Date().toISOString(),
    data: { trades: [] } // Legacy compact
}];

fs.writeFileSync('./public/injected_portfolio.json', JSON.stringify(portfolio));
console.log('Portfolio JSON written to ./public/injected_portfolio.json');
