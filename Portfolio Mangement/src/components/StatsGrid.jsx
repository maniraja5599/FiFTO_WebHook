import React from 'react';
import { TrendingUp, TrendingDown, Target, Zap, Clock, AlertTriangle } from 'lucide-react';

export function StatsGrid({ stats }) {
    const cards = [
        {
            label: 'Net Profit',
            value: stats.netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            subValue: `${stats.totalTrades} Trades`,
            icon: TrendingUp,
            color: stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400',
            bg: stats.netProfit >= 0 ? 'bg-green-400/10' : 'bg-red-400/10',
        },
        {
            label: 'Win Rate',
            value: `${stats.winRate.toFixed(2)}%`,
            subValue: 'Probability',
            icon: Target,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
        },
        {
            label: 'Risk Reward',
            value: stats.riskReward.toFixed(2),
            subValue: 'Ratio',
            icon: Zap,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
        },
        {
            label: 'Max Drawdown',
            value: stats.maxDrawdown.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            subValue: 'Peak to Valley',
            icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-400/10',
        },
        {
            label: 'Avg Win',
            value: stats.avgWin.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            subValue: 'Per Trade',
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
        },
        {
            label: 'Avg Loss',
            value: stats.avgLoss.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            subValue: 'Per Trade',
            icon: TrendingDown,
            color: 'text-rose-400',
            bg: 'bg-rose-400/10',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card, index) => (
                <div key={index} className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-colors shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">{card.label}</p>
                            <h3 className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</h3>
                        </div>
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                    </div>
                    <div className="flex items-center text-xs text-slate-500">
                        {card.subValue}
                    </div>
                </div>
            ))}
        </div>
    );
}
