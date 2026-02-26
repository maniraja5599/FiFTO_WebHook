import React from 'react';
import { formatCurrency } from '../utils/formatters';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Scale from 'lucide-react/dist/esm/icons/scale';
import Percent from 'lucide-react/dist/esm/icons/percent';
import Target from 'lucide-react/dist/esm/icons/target';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import ArrowDownCircle from 'lucide-react/dist/esm/icons/arrow-down-circle';

const DualStatCard = ({ title, leftData, rightData, icon: Icon }) => {
    return (
        <div className="p-6 bg-premium-card/30 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-premium-card/50 transition-all duration-300 group">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-premium-gold/10 text-premium-gold group-hover:bg-premium-gold/20 transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-white font-semibold text-lg">{title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 relative">
                {/* Divider */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 transform -translate-x-1/2"></div>

                {/* Left Side */}
                <div className="text-center">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{leftData.label}</div>
                    <div className={`text-xl font-bold ${leftData.color || 'text-white'}`}>{leftData.value}</div>
                    {leftData.subValue && <div className="text-[10px] text-gray-500 mt-1">{leftData.subValue}</div>}
                </div>

                {/* Right Side */}
                <div className="text-center">
                    <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">{rightData.label}</div>
                    <div className={`text-xl font-bold ${rightData.color || 'text-white'}`}>{rightData.value}</div>
                    {rightData.subValue && <div className="text-[10px] text-gray-500 mt-1">{rightData.subValue}</div>}
                </div>
            </div>
        </div>
    );
};

const PnLStats = ({ data }) => {
    if (!data || data.length === 0) return null;

    // Calculations
    const totalDays = data.length;
    const winDays = data.filter(d => d.dailyPnL > 0).length;
    const lossDays = data.filter(d => d.dailyPnL <= 0).length;
    const winRate = ((winDays / totalDays) * 100).toFixed(1);

    const profits = data.filter(d => d.dailyPnL > 0).map(d => d.dailyPnL);
    const losses = data.filter(d => d.dailyPnL <= 0).map(d => d.dailyPnL);

    const maxProfit = Math.max(...profits, 0);
    const maxLoss = Math.min(...losses, 0);

    const totalProfit = profits.reduce((a, b) => a + b, 0);
    const totalLoss = Math.abs(losses.reduce((a, b) => a + b, 0));

    const avgWin = profits.length ? totalProfit / profits.length : 0;
    const avgLoss = losses.length ? totalLoss / losses.length : 0; // stored as positive for display

    const profitFactor = totalLoss > 0 ? (totalProfit / totalLoss).toFixed(2) : '∞';
    const expectancy = (avgWin * (winRate / 100)) - (avgLoss * ((100 - winRate) / 100));

    // Max Drawdown Calculation
    let peak = -Infinity;
    let maxDrawdown = 0;
    let runningPnL = 0;

    data.forEach(d => {
        runningPnL = d.cumulativePnL;
        if (runningPnL > peak) peak = runningPnL;
        const drawdown = peak - runningPnL;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const netPnL = data.reduce((acc, curr) => acc + curr.dailyPnL, 0);
    const totalROI = ((netPnL / 10000000) * 100).toFixed(2);

    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Card 1: Return & Risk */}
            <DualStatCard
                title="Return & Risk"
                icon={Activity}
                leftData={{
                    label: "Total ROI",
                    value: `${totalROI}%`,
                    color: Number(totalROI) > 0 ? "text-green-400" : "text-red-400",
                    subValue: "On ₹1Cr Capital"
                }}
                rightData={{
                    label: "Max Drawdown",
                    value: formatCurrency(maxDrawdown),
                    color: "text-red-400",
                    subValue: "Peak to Trough"
                }}
            />

            {/* Card 2: Efficiency */}
            <DualStatCard
                title="Efficiency"
                icon={Scale}
                leftData={{
                    label: "Win Rate",
                    value: `${winRate}%`,
                    color: Number(winRate) > 50 ? "text-green-400" : "text-yellow-400"
                }}
                rightData={{
                    label: "Profit Factor",
                    value: profitFactor,
                    color: Number(profitFactor) > 1.5 ? "text-green-400" : "text-yellow-400"
                }}
            />

            {/* Card 3: Days Analysis */}
            <DualStatCard
                title="Days Analysis"
                icon={BarChart3}
                leftData={{
                    label: "Green Days",
                    value: winDays,
                    color: "text-green-400"
                }}
                rightData={{
                    label: "Red Days",
                    value: lossDays,
                    color: "text-red-400"
                }}
            />

            {/* Card 4: Extreme Trades */}
            <DualStatCard
                title="Extreme Trades"
                icon={Target}
                leftData={{
                    label: "Max Profit",
                    value: formatCurrency(maxProfit),
                    color: "text-green-400",
                    subValue: "Single Day"
                }}
                rightData={{
                    label: "Max Loss",
                    value: formatCurrency(maxLoss),
                    color: "text-red-400",
                    subValue: "Single Day"
                }}
            />

            {/* Card 5: Average Trades */}
            <DualStatCard
                title="Average Trades"
                icon={TrendingUp}
                leftData={{
                    label: "Avg Win",
                    value: formatCurrency(Math.round(avgWin)),
                    color: "text-green-400"
                }}
                rightData={{
                    label: "Avg Loss",
                    value: formatCurrency(Math.round(avgLoss)),
                    color: "text-red-400"
                }}
            />

            {/* Card 6: Overview */}
            <DualStatCard
                title="Overview"
                icon={Activity}
                leftData={{
                    label: "Expectancy",
                    value: formatCurrency(Math.round(expectancy)),
                    color: expectancy > 0 ? "text-green-400" : "text-red-400",
                    subValue: "Daily Avg"
                }}
                rightData={{
                    label: "Total Days",
                    value: totalDays,
                    subValue: "Trading Days"
                }}
            />
        </div>
    );
};

export default PnLStats;
