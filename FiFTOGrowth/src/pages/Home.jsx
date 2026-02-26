import React, { Suspense, lazy, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MeteorBackground from '../components/MeteorBackground';
import { pnlData } from '../utils/pnlData';

// Lazy load components
const PnLChart = lazy(() => import('../components/PnLChart'));
const CumulativePnLChart = lazy(() => import('../components/CumulativePnLChart'));

const PnLTable = lazy(() => import('../components/PnLTable'));
const Roadmap = lazy(() => import('../components/Roadmap'));
const ProfitSharing = lazy(() => import('../components/ProfitSharing'));
const Footer = lazy(() => import('../components/Footer'));
const AnimatedDivider = lazy(() => import('../components/AnimatedDivider'));

// Loading fallback component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-premium-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const Home = () => {
    const [selectedSegment, setSelectedSegment] = useState('All');
    const segments = ['All', 'F&O', 'Equity', 'Commodity', 'Currency'];

    const filteredData = useMemo(() => {
        let cumulative = 0;
        return pnlData.map(d => {
            let dailyVal = d.dailyPnL;
            if (selectedSegment === 'F&O') dailyVal = d.fnoPnL;
            else if (selectedSegment === 'Equity') dailyVal = d.equityPnL;
            else if (selectedSegment === 'Commodity') dailyVal = d.commodityPnL;
            else if (selectedSegment === 'Currency') dailyVal = d.currencyPnL;

            cumulative += dailyVal;
            return {
                ...d,
                dailyPnL: dailyVal,
                cumulativePnL: cumulative,
                roi: ((dailyVal / 10000000) * 100).toFixed(2)
            };
        });
    }, [selectedSegment]);

    return (
        <div className="bg-premium-dark min-h-screen text-white selection:bg-premium-gold selection:text-black relative">
            <MeteorBackground />
            <Navbar />
            <Hero />

            <div className="container mx-auto px-6 mb-8 relative z-10">
                <div className="flex flex-wrap justify-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                    {segments.map(seg => (
                        <button
                            key={seg}
                            onClick={() => setSelectedSegment(seg)}
                            className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${selectedSegment === seg
                                    ? 'bg-premium-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                                }`}
                        >
                            {seg}
                        </button>
                    ))}
                </div>
            </div>

            <Suspense fallback={<LoadingSpinner />}>
                <AnimatedDivider />
                <PnLChart data={filteredData} selectedSegment={selectedSegment} />
                <AnimatedDivider />
                <CumulativePnLChart data={filteredData} selectedSegment={selectedSegment} />
                <AnimatedDivider />
                <PnLTable data={filteredData} selectedSegment={selectedSegment} />
                <AnimatedDivider />
                <Roadmap />
                <AnimatedDivider />
                <ProfitSharing />
                <AnimatedDivider />
                <Footer />
            </Suspense>
        </div>
    );
};

export default Home;
