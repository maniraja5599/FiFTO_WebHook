import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function EquityChart({ data }) {
    // Format data for chart if needed, or assume data is already in correct format
    // data prop is array of { time, equity, drawdown }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-slate-300 text-sm mb-2">{label}</p>
                    <p className="text-green-400 font-bold">
                        Equity: ₹{payload[0].value.toLocaleString()}
                    </p>
                    {payload[1] && (
                        <p className="text-red-400 text-sm">
                            Drawdown: ₹{Math.abs(payload[1].value).toLocaleString()}
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="time"
                        hide={true} // Hide X axis labels for cleaner look if too many points
                    />
                    <YAxis
                        stroke="#64748b"
                        tickFormatter={(value) => `₹${value / 1000}k`}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="equity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorEquity)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
