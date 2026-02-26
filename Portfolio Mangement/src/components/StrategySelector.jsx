import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export function StrategySelector({ strategies, onToggle }) {
    if (!strategies || strategies.length === 0) return null;

    const totalSelected = strategies.filter(s => s.selected).length;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                Active Strategies ({totalSelected})
            </h3>
            <div className="flex flex-wrap gap-2">
                {strategies.map((strategy) => (
                    <button
                        key={strategy.id}
                        onClick={() => onToggle(strategy.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${strategy.selected
                                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30'
                                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-800/80 hover:text-slate-400'
                            }`}
                    >
                        {strategy.selected ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        ) : (
                            <Circle className="w-4 h-4 text-slate-600" />
                        )}
                        <span className="max-w-[150px] truncate" title={strategy.name}>
                            {strategy.name}
                        </span>
                        <span className="text-xs opacity-60 ml-1">
                            ({strategy.trades.length})
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
