import React from 'react';
import { useNavigate } from 'react-router-dom';
import MeteorBackground from '../components/MeteorBackground';
import LogOut from 'lucide-react/dist/esm/icons/log-out';

const Dashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    // Mock Data
    const clientData = {
        initialCapital: 10000000, // 1 Cr
        currentMonthProfit: 450000,
        overallProfit: 2450000,
        overallROI: 24.5
    };

    // Calculate Profit Sharing based on slab
    const getProfitShare = (capital, profit) => {
        let percentage = 0;
        // Clients are 1Cr and above
        if (capital <= 50000000) percentage = 20;      // 1 Cr - 5 Cr
        else if (capital <= 100000000) percentage = 15; // 5 Cr - 10 Cr
        else if (capital <= 200000000) percentage = 12; // 10 Cr - 20 Cr
        else percentage = 10;                           // Above 20 Cr

        return {
            amount: (profit * percentage) / 100,
            percentage: percentage
        };
    };

    const profitShare = getProfitShare(clientData.initialCapital, clientData.currentMonthProfit);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-premium-dark text-white relative">
            <MeteorBackground />

            {/* Dashboard Header */}
            <header className="border-b border-white/10 bg-premium-dark/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-premium-gold">Client Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Initial Capital */}
                    <div className="glass-panel p-6">
                        <h3 className="text-gray-400 text-sm mb-1">Initial Capital</h3>
                        <div className="text-2xl font-bold text-white">{formatCurrency(clientData.initialCapital)}</div>
                        <div className="text-gray-500 text-xs mt-2">Deployed on Jan 1, 2024</div>
                    </div>

                    {/* Overall P&L */}
                    <div className="glass-panel p-6">
                        <h3 className="text-gray-400 text-sm mb-1">Overall P&L</h3>
                        <div className="text-2xl font-bold text-green-500">+{formatCurrency(clientData.overallProfit)}</div>
                        <div className="text-green-500 text-xs mt-2 flex items-center gap-1">
                            <span>+{clientData.overallROI}%</span> <span className="text-gray-500">All time ROI</span>
                        </div>
                    </div>

                    {/* This Month Profit */}
                    <div className="glass-panel p-6">
                        <h3 className="text-gray-400 text-sm mb-1">This Month Profit</h3>
                        <div className="text-2xl font-bold text-green-500">+{formatCurrency(clientData.currentMonthProfit)}</div>
                        <div className="text-gray-500 text-xs mt-2">October 2024</div>
                    </div>

                    {/* Profit Sharing Amount */}
                    <div className="glass-panel p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-premium-gold/10 rounded-bl-full -mr-8 -mt-8"></div>
                        <h3 className="text-premium-gold text-sm mb-1 font-medium">Profit Sharing</h3>
                        <div className="text-2xl font-bold text-white">{formatCurrency(profitShare.amount)}</div>
                        <div className="text-gray-400 text-xs mt-2">
                            {profitShare.percentage}% Slab • Pending for Oct 2024
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-8 text-center py-20">
                    <h2 className="text-xl text-gray-400">Detailed reports and charts coming soon...</h2>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
