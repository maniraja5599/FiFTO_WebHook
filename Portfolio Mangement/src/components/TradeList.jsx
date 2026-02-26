import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

export function TradeList({ trades }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(trades.length / itemsPerPage);

    const currentTrades = trades.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Trade History</h3>
                <div className="text-sm text-slate-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, trades.length)} of {trades.length}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Date</th>
                            <th className="px-4 py-3">Instrument</th>
                            <th className="px-4 py-3 text-center">Type</th>
                            <th className="px-4 py-3 text-right">Price</th>
                            <th className="px-4 py-3 text-right rounded-r-lg">P&L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentTrades.map((trade) => (
                            <tr key={trade.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3">
                                    {trade.entryTime}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-200">
                                    {trade.instrument}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${trade.type === 'BUY' ? 'bg-blue-400/10 text-blue-400' : 'bg-orange-400/10 text-orange-400'
                                        }`}>
                                        {trade.type}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {trade.entryPrice}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {trade.profit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4 border-t border-slate-800 pt-4">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-slate-400">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
