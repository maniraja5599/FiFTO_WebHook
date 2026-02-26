import * as XLSX from 'xlsx';

export const processData = async (files) => {
    // Ensure files is an array
    const fileList = Array.isArray(files) ? files : [files];
    const strategies = [];

    // Process each file sequentially
    for (const file of fileList) {
        try {
            const fileTrades = await readFileData(file);
            strategies.push({
                id: crypto.randomUUID(), // Unique ID for selection
                name: file.name,
                trades: fileTrades,
                selected: true // Default to selected
            });
        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
        }
    }

    if (strategies.length === 0) {
        throw new Error("No valid data found in uploaded files.");
    }

    return strategies;
};

export const aggregateData = (strategies) => {
    // Filter only selected strategies
    const activeStrategies = strategies.filter(s => s.selected);

    if (activeStrategies.length === 0) return null;

    const allTrades = [];
    activeStrategies.forEach(s => {
        allTrades.push(...s.trades);
    });

    // Re-index IDs to be unique across merged set
    const mergedTrades = allTrades.map((trade, index) => ({ ...trade, id: index }));
    // Sort by entry time
    mergedTrades.sort((a, b) => {
        const timeA = new Date(parseTime(a.entryTime)).getTime();
        const timeB = new Date(parseTime(b.entryTime)).getTime();
        return timeA - timeB;
    });

    // Calculate Stats on merged data
    const stats = calculateStats(mergedTrades);

    return { trades: mergedTrades, stats };
};

const readFileData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // Basic validation and transformation
                const processedData = jsonData.map((row) => { // ID assigned later
                    // Attempt to normalize keys
                    return {
                        entryTime: row['Entry Time'] || row['Entry Date'] || row['Date'],
                        exitTime: row['Exit Time'] || row['Exit Date'],
                        instrument: row['Instrument'] || row['Symbol'],
                        profit: parseFloat(row['Profit'] || row['P&L'] || row['PnL'] || 0),
                        quantity: parseInt(row['Qty'] || row['Quantity'] || 0),
                        entryPrice: parseFloat(row['Entry Price'] || row['Entry'] || 0),
                        exitPrice: parseFloat(row['Exit Price'] || row['Exit'] || 0),
                        type: row['Entry']?.includes('SELL') ? 'SELL' : 'BUY', // Heuristic
                        original: row
                    };
                }).filter(trade => trade.entryTime && !isNaN(trade.profit)); // Filter invalid rows

                resolve(processedData);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

// Helper for sorting
function parseTime(timeVal) {
    if (typeof timeVal === 'number') {
        return new Date(Math.round((timeVal - 25569) * 86400 * 1000));
    }
    // Handle string dates - simplistic approach
    // In calculateStats we had logic, reuse parsing logic or robust library.
    // For sorting purposes, new Date(timeVal) often works if ISO.
    // If DD-MM-YYYY...
    if (typeof timeVal === 'string') {
        const parts = timeVal.split(' ')[0].split('-');
        if (parts.length === 3) {
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]} ${timeVal.split(' ')[1] || '00:00'}`);
        }
    }
    return new Date(timeVal);
}

function calculateStats(trades) {
    let totalTrades = trades.length;
    let wins = trades.filter(t => t.profit > 0);
    let losses = trades.filter(t => t.profit <= 0);

    let totalProfit = wins.reduce((sum, t) => sum + t.profit, 0);
    let totalLoss = losses.reduce((sum, t) => sum + Math.abs(t.profit), 0);
    let netProfit = totalProfit - totalLoss;

    let winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
    let avgWin = wins.length > 0 ? totalProfit / wins.length : 0;
    let avgLoss = losses.length > 0 ? totalLoss / losses.length : 0;
    let riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Max Drawdown Calculation
    let peak = -Infinity;
    let maxDrawdown = 0;
    let runningPnL = 0;
    let equityCurve = [];

    trades.forEach(t => {
        runningPnL += t.profit;
        if (runningPnL > peak) peak = runningPnL;
        let drawdown = peak - runningPnL;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;

        equityCurve.push({
            time: t.exitTime,
            equity: runningPnL,
            drawdown: -drawdown
        });
    });

    // Monthly Analysis
    const monthlyStats = {};
    // Day of Week Analysis
    const dayStats = {
        'Monday': { hits: 0, misses: 0, profit: 0, loss: 0, total: 0 },
        'Tuesday': { hits: 0, misses: 0, profit: 0, loss: 0, total: 0 },
        'Wednesday': { hits: 0, misses: 0, profit: 0, loss: 0, total: 0 },
        'Thursday': { hits: 0, misses: 0, profit: 0, loss: 0, total: 0 },
        'Friday': { hits: 0, misses: 0, profit: 0, loss: 0, total: 0 },
        'Saturday': { hits: 0, misses: 0, profit: 0, loss: 0, total: 0 },
        'Sunday': { hits: 0, misses: 0, profit: 0, loss: 0, total: 0 },
    };

    trades.forEach(t => {
        if (!t.entryTime) return; // Use entry time for day of week

        // Date Parsing for Entry Time
        let date;
        if (typeof t.entryTime === 'number') {
            date = new Date(Math.round((t.entryTime - 25569) * 86400 * 1000));
        } else {
            // Try standard parsing first
            date = new Date(t.entryTime);
            // If invalid, try parsing dd-mm-yyyy or similar formats if needed, 
            // but usually standard Date constructor handles ISO and common formats.
            // Fallback for dd-mm-yyyy
            if (isNaN(date.getTime()) && typeof t.entryTime === 'string') {
                const parts = t.entryTime.split(' ')[0].split('-');
                if (parts.length === 3) {
                    date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
            }
        }

        if (isNaN(date.getTime())) return;

        // Day of Week
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        if (dayStats[dayName]) {
            dayStats[dayName].total += t.profit;
            if (t.profit > 0) {
                dayStats[dayName].hits += 1;
                dayStats[dayName].profit += t.profit;
            } else {
                dayStats[dayName].misses += 1;
                dayStats[dayName].loss += t.profit; // Keep loss negative
            }
        }

        // Monthly (reusing existing logic but ensuring date is from exitTime for monthly pnL usually? 
        // Plan said Entry Time for Day of Week, but Monthly was already using Exit Time in previous code.
        // I will leave Monthly logic as is (using exitTime) and just add Day of Week using Entry Time.
    });

    // Existing Monthly Logic
    trades.forEach(t => {
        if (!t.exitTime) return;
        let date;
        if (typeof t.exitTime === 'number') {
            date = new Date(Math.round((t.exitTime - 25569) * 86400 * 1000));
        } else {
            const parts = t.exitTime.split(' ')[0].split('-');
            if (parts.length === 3) {
                date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else {
                date = new Date(t.exitTime);
            }
        }

        if (isNaN(date.getTime())) return;

        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = {
                month: monthKey,
                profit: 0,
                wins: 0,
                losses: 0,
                trades: 0
            };
        }

        monthlyStats[monthKey].profit += t.profit;
        monthlyStats[monthKey].trades += 1;
        if (t.profit > 0) monthlyStats[monthKey].wins += 1;
        else monthlyStats[monthKey].losses += 1;
    });

    const monthlyData = Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month));
    const dayOfWeekData = Object.entries(dayStats)
        .filter(([day]) => day !== 'Sunday') // Usually ignore Sunday for trading unless crypto
        .map(([day, stats]) => ({ day, ...stats }));

    // Sort days: Mon-Sat
    const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
    dayOfWeekData.sort((a, b) => dayOrder[a.day] - dayOrder[b.day]);

    return {
        totalTrades,
        winRate,
        netProfit,
        maxDrawdown,
        avgWin,
        avgLoss,
        riskReward,
        equityCurve,
        monthlyData,
        dayOfWeekData
    };
}
