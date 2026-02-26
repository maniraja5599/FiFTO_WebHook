import React from 'react';
import { motion } from 'framer-motion';

export function DayOfWeekAnalysis({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="space-y-4">
            {data.map((day, index) => (
                <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 text-sm"
                >
                    {/* Day Name */}
                    <div className="w-24 font-medium text-slate-400 text-right">
                        {day.day}
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-4">
                        {/* Hit/Miss Bar */}
                        <div className="relative h-8 bg-slate-800/50 rounded-lg overflow-hidden flex">
                            <div className="absolute inset-0 flex items-center justify-between px-3 z-10">
                                <span className="font-semibold text-teal-400">Hit {day.hits}</span>
                                <span className="font-semibold text-amber-500">Miss {day.misses}</span>
                            </div>
                            <div
                                className="h-full bg-teal-500/20"
                                style={{ width: `${(day.hits / (day.hits + day.misses || 1)) * 100}%` }}
                            />
                            <div
                                className="h-full bg-amber-500/20 flex-1"
                            />
                        </div>

                        {/* Profit/Loss Bar */}
                        <div className="relative h-8 bg-slate-800/50 rounded-lg overflow-hidden flex">
                            <div className="absolute inset-0 flex items-center justify-between px-3 z-10">
                                <span className="font-semibold text-emerald-400">
                                    ₹{day.profit.toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                                </span>
                                <span className="font-semibold text-red-400">
                                    ₹{Math.abs(day.loss).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                                </span>
                            </div>
                            {/* Visualizing profit vs loss magnitude is tricky in a single bar split. 
                   The user's image shows two separate bars or a split bar. 
                   Let's do a split bar proportional to the total magnitude. */}
                            <div
                                className="h-full bg-emerald-500/20"
                                style={{ width: `${(day.profit / ((day.profit + Math.abs(day.loss)) || 1)) * 100}%` }}
                            />
                            <div
                                className="h-full bg-red-500/20 flex-1"
                            />
                        </div>
                    </div>

                    {/* Total Net Logic (Optional, user image didn't clearly show a net column but had total values) */}
                    {/* The user image has Hit/Miss bar, Profit, Loss values. The bars were underneath. 
               My implementation puts text on top of bars for compactness. */}
                </motion.div>
            ))}
        </div>
    );
}
