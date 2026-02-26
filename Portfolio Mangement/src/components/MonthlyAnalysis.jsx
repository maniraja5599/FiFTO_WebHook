import React from 'react';

export function MonthlyAnalysis({ data }) {
    if (!data || data.length === 0) return null;

    // Process data into Year -> Month map
    const years = {};
    let minProfit = Infinity;
    let maxProfit = -Infinity;

    data.forEach(m => {
        const [yearStr, monthStr] = m.month.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; // 0-indexed

        if (!years[year]) years[year] = Array(12).fill(null);
        years[year][month] = m;

        if (m.profit < minProfit) minProfit = m.profit;
        if (m.profit > maxProfit) maxProfit = m.profit;
    });

    const sortedYears = Object.keys(years).sort((a, b) => b - a); // Descending years
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const getCellColor = (value) => {
        if (!value) return 'bg-slate-900';
        if (value.profit >= 0) {
            // Green intensity
            const intensity = Math.max(0.2, Math.min(1, value.profit / (maxProfit || 1)));
            return `rgba(16, 185, 129, ${intensity})`; // emerald-500
        } else {
            // Red intensity
            const intensity = Math.max(0.2, Math.min(1, Math.abs(value.profit) / (Math.abs(minProfit) || 1)));
            return `rgba(239, 68, 68, ${intensity})`; // red-500
        }
    };

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[600px]">
                {/* Header */}
                <div className="flex mb-2">
                    <div className="w-16 shrink-0"></div>
                    <div className="flex-1 grid grid-cols-12 gap-1">
                        {months.map(m => (
                            <div key={m} className="text-xs text-slate-500 text-center uppercase">{m}</div>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <div className="space-y-1">
                    {sortedYears.map(year => (
                        <div key={year} className="flex items-center">
                            <div className="w-16 shrink-0 text-sm font-medium text-slate-400">{year}</div>
                            <div className="flex-1 grid grid-cols-12 gap-1 h-10">
                                {years[year].map((monthData, index) => (
                                    <div
                                        key={index}
                                        className="relative group rounded-sm border border-slate-800/50 transition-all hover:border-slate-600 hover:z-10"
                                        style={{ backgroundColor: monthData ? getCellColor(monthData) : 'rgba(30, 41, 59, 0.3)' }}
                                    >
                                        {monthData && (
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 min-w-max p-2 bg-slate-800 text-xs rounded border border-slate-700 shadow-xl">
                                                <div className="font-semibold text-slate-200 mb-1">
                                                    {months[index]} {year}
                                                </div>
                                                <div className={monthData.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                    PnL: {monthData.profit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                </div>
                                                <div className="text-slate-400">
                                                    Trades: {monthData.trades} (Win: {Math.round((monthData.wins / monthData.trades) * 100)}%)
                                                </div>
                                            </div>
                                        )}
                                        {monthData && (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-[10px] text-white/50 font-medium">
                                                    {/* Optional: Show tiny text or keep clean? User asked for heatmap. 
                                                         Let's keep clean blocks, rely on tooltip. 
                                                         Or maybe show 'K' value if space permits? 
                                                         Let's keep it clean for 'heatmap' aesthetic. */}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500">
                <span>Loss</span>
                <div className="flex gap-0.5">
                    <div className="w-3 h-3 bg-red-500/20 rounded-sm"></div>
                    <div className="w-3 h-3 bg-red-500/60 rounded-sm"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                </div>
                <span>Profit</span>
                <div className="flex gap-0.5">
                    <div className="w-3 h-3 bg-emerald-500/20 rounded-sm"></div>
                    <div className="w-3 h-3 bg-emerald-500/60 rounded-sm"></div>
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                </div>
            </div>
        </div>
    );
}
