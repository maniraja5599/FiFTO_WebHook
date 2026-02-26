import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2';
import PieChart from 'lucide-react/dist/esm/icons/pie-chart';

import { pnlData as data } from '../utils/pnlData';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const value = payload[0].value;
        return (
            <div className="bg-premium-card border border-white/10 p-3 rounded-lg shadow-xl z-50">
                <p className="text-gray-400 text-xs mb-2">{label}</p>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-400 text-xs">
                        Cumulative P&L:
                    </span>
                    <span className={`font-mono font-bold text-sm ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {value >= 0 ? '+' : ''}{formatCurrency(value).replace('₹', '₹')}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const CumulativePnLChart = () => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (!data || data.length === 0) return null;

    const chartData = data;
    const showBrush = isFullScreen;

    return (
        <section id="equity-curve" className="py-20 bg-premium-card/30">
            <div className="container mx-auto px-6">
                <div className="w-full mb-12">
                    <div className="w-full space-y-8">
                        {/* P&L Chart Container */}
                        <div
                            className={`transition-all duration-300 ${isFullScreen
                                ? 'fixed inset-0 z-50 bg-premium-dark p-6 md:p-10 flex flex-col'
                                : 'glass-panel p-6 md:p-8 h-[550px] relative group'
                                }`}
                        >
                            {/* Highlight Effect (Only in normal mode) */}
                            {!isFullScreen && (
                                <div className="absolute -inset-[1px] bg-gradient-to-r from-premium-gold/0 via-premium-gold/20 to-premium-gold/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-sm" />
                            )}

                            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 relative z-10">
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <span className="text-white">Cumulative</span>
                                    <span className="text-premium-gold">P&L</span>
                                    <span className="text-xs bg-premium-gold/20 text-premium-gold px-2 py-0.5 rounded-full border border-premium-gold/30">Equity Curve</span>
                                </h3>

                                <div className="flex items-center gap-4">
                                    {/* Icon Indicator */}
                                    <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                                        <div className="p-1.5 rounded-md bg-premium-gold text-black shadow-lg" title="Cumulative P&L">
                                            <PieChart className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {/* Full Screen / Zoom Toggle */}
                                    <button
                                        onClick={() => setIsFullScreen(!isFullScreen)}
                                        className={`p-2 rounded-lg border transition-all ${isFullScreen
                                            ? 'bg-premium-gold/20 border-premium-gold text-premium-gold'
                                            : 'bg-black/20 border-white/5 text-gray-400 hover:text-white'}`}
                                        title={isFullScreen ? "Exit Full Screen" : "Full Screen Zoom"}
                                    >
                                        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className={`${isFullScreen ? 'flex-1 min-h-0' : 'h-[450px]'} w-full relative z-10`}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                                        <defs>
                                            <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#666"
                                            tick={{ fill: '#888', fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            stroke="#666"
                                            tick={{ fill: '#888', fontSize: 10 }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={formatCurrency}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                                        <ReferenceLine y={0} stroke="#666" />
                                        <Area
                                            type="monotone"
                                            dataKey="cumulativePnL"
                                            stroke="#D4AF37"
                                            fillOpacity={1}
                                            fill="url(#colorCumulative)"
                                            strokeWidth={2}
                                        />
                                        {showBrush && <Brush dataKey="date" height={30} stroke="#D4AF37" fill="#1f2937" />}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CumulativePnLChart;
