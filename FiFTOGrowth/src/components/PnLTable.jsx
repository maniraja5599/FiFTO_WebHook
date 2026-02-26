import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { pnlData } from '../utils/pnlData';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import ArrowDownRight from 'lucide-react/dist/esm/icons/arrow-down-right';
import Download from 'lucide-react/dist/esm/icons/download';

const PnLTable = () => {
    // Calculate cumulative ROI before reversing
    let runningRoi = 0;
    const dataWithCumulativeRoi = pnlData.map(day => {
        runningRoi += parseFloat(day.roi);
        return {
            ...day,
            cumulativeRoi: runningRoi.toFixed(2)
        };
    });

    // Reverse data to show newest first
    const sortedData = [...dataWithCumulativeRoi].reverse();

    const handleExport = () => {
        // Define CSV headers
        const headers = ['Date', 'Daily P&L', 'ROI (%)', 'Cumulative ROI (%)', 'Cumulative P&L'];

        // Convert data to CSV rows
        const rows = sortedData.map(day => [
            day.date,
            day.dailyPnL,
            day.roi,
            day.cumulativeRoi,
            day.cumulativePnL
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `pnl_data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <section className="py-12 bg-premium-dark">
            <div className="container mx-auto px-4 md:px-6">
                <div className="mb-8 relative flex flex-col md:flex-row items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-1">
                            <span className="text-white">Daily Performance</span> <span className="text-premium-gold">Ledger</span>
                        </h2>
                        <p className="text-gray-400 text-sm">Detailed breakdown of every trading day.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="mt-4 md:mt-0 md:absolute md:right-0 flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors text-premium-gold hover:text-premium-gold-hover"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-premium-card/30 backdrop-blur-sm shadow-2xl">
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-black/40 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">P&L</th>
                                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">ROI</th>
                                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cum. ROI</th>
                                    <th scope="col" className="px-4 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cumulative</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-transparent">
                                {sortedData.map((day, index) => (
                                    <tr key={index} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-gray-300 font-mono border-l-2 border-transparent group-hover:border-premium-gold/50 transition-all">
                                            {day.date}
                                        </td>
                                        <td className={`px-4 py-2.5 whitespace-nowrap text-xs font-bold text-right font-mono ${day.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                {day.dailyPnL >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 opacity-70" /> : <ArrowDownRight className="w-3.5 h-3.5 opacity-70" />}
                                                {day.dailyPnL >= 0 ? '+' : ''}{formatCurrency(day.dailyPnL).replace('₹', '₹')}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-2.5 whitespace-nowrap text-xs text-right font-mono ${Number(day.roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {day.roi}%
                                        </td>
                                        <td className={`px-4 py-2.5 whitespace-nowrap text-xs text-right font-mono ${Number(day.cumulativeRoi) >= 0 ? 'text-premium-gold' : 'text-red-400'}`}>
                                            {day.cumulativeRoi}%
                                        </td>
                                        <td className={`px-4 py-2.5 whitespace-nowrap text-xs font-bold text-right font-mono ${day.cumulativePnL >= 0 ? 'text-premium-gold' : 'text-red-400'}`}>
                                            {day.cumulativePnL >= 0 ? '+' : ''}{formatCurrency(day.cumulativePnL).replace('₹', '₹')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PnLTable;
