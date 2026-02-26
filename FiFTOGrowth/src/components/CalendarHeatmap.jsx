import React from 'react';
import { formatCurrency } from '../utils/formatters';

const CalendarHeatmap = ({ data }) => {
    // Helper to get color based on P&L
    const getColor = (pnl) => {
        if (pnl === 0) return 'bg-white/5';
        if (pnl > 0) {
            if (pnl > 50000) return 'bg-green-500'; // High profit
            if (pnl > 20000) return 'bg-green-500/70';
            return 'bg-green-500/40'; // Low profit
        } else {
            if (pnl < -50000) return 'bg-red-500'; // High loss
            if (pnl < -20000) return 'bg-red-500/70';
            return 'bg-red-500/40'; // Low loss
        }
    };

    // Group data by month
    const months = {};
    data.forEach(day => {
        const date = new Date(day.rawDate);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!months[monthKey]) months[monthKey] = [];
        months[monthKey].push(day);
    });

    // Calculate start and end dates
    const startDate = data.length > 0 ? data[0].date : '';
    const endDate = data.length > 0 ? data[data.length - 1].date : '';

    return (
        <div className="glass-panel p-4 max-w-3xl mx-auto">
            <h3 className="text-lg font-bold mb-4">
                <span className="text-white">Consistency</span> <span className="text-premium-gold">Heatmap</span> <span className="text-xs font-normal text-gray-400 ml-2">({startDate} - {endDate})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(months).map(([month, days]) => (
                    <div key={month}>
                        <h4 className="text-xs font-medium text-gray-400 mb-2">{month}</h4>
                        <div className="grid grid-cols-7 gap-[1px]">
                            {days.map((day, index) => (
                                <div
                                    key={index}
                                    className={`w-full aspect-square rounded-[1px] ${getColor(day.dailyPnL)} relative group cursor-pointer transition-all hover:scale-110 hover:z-10`}
                                >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded whitespace-nowrap z-20 border border-white/10 shadow-xl">
                                        <div className="font-bold">{day.date}</div>
                                        <div className={day.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {day.dailyPnL >= 0 ? '+' : ''}{formatCurrency(day.dailyPnL).replace('₹', '₹')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-4 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                    <span>Heavy Loss</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white/5 rounded-sm"></div>
                    <span>No Trade</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                    <span>Heavy Profit</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarHeatmap;
