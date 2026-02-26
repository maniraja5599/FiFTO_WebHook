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
    const segments = [
        { id: 'fnoPnL', label: 'F&O' },
        { id: 'equityPnL', label: 'Equity' },
        { id: 'commodityPnL', label: 'Commodity' }
    ];

    const [selectedSegments, setSelectedSegments] = useState(segments.map(s => s.id));

    const toggleSegment = (id) => {
        setSelectedSegments(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const selectAll = () => {
        if (selectedSegments.length === segments.length) {
            setSelectedSegments([]);
        } else {
            setSelectedSegments(segments.map(s => s.id));
        }
    };

    const filteredData = useMemo(() => {
        let cumulative = 0;
        return pnlData.map(d => {
            let dailyVal = 0;
            selectedSegments.forEach(segId => {
                dailyVal += (d[segId] || 0);
            });

            cumulative += dailyVal;
            return {
                ...d,
                dailyPnL: dailyVal,
                cumulativePnL: cumulative,
                roi: ((dailyVal / 10000000) * 100).toFixed(2)
            };
        });
    }, [selectedSegments]);

    const formatSelectedLabel = () => {
        if (selectedSegments.length === segments.length) return 'All Segments';
        if (selectedSegments.length === 0) return 'No Segment Selected';
        return segments.filter(s => selectedSegments.includes(s.id)).map(s => s.label).join(' + ');
    };

    return (
        <div className="bg-premium-dark min-h-screen text-white selection:bg-premium-gold selection:text-black relative">
            <MeteorBackground />
            <Navbar />
            <Hero />

            <div className="container mx-auto px-6 mb-8 relative z-10">
                <div className="flex flex-col items-center gap-4 bg-black/30 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={selectAll}
                            className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 border ${selectedSegments.length === segments.length
                                ? 'bg-premium-gold text-black border-premium-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
                                }`}
                        >
                            All
                        </button>
                        {segments.map(seg => (
                            <button
                                key={seg.id}
                                onClick={() => toggleSegment(seg.id)}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 border ${selectedSegments.includes(seg.id)
                                    ? 'bg-premium-gold/20 text-premium-gold border-premium-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                                    : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
                                    }`}
                            >
                                {seg.label}
                            </button>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                        Active: <span className="text-premium-gold">{formatSelectedLabel()}</span>
                    </div>
                </div>
            </div>

            <Suspense fallback={<LoadingSpinner />}>
                <AnimatedDivider />
                <PnLChart data={filteredData} selectedSegment={formatSelectedLabel()} />
                <AnimatedDivider />
                <CumulativePnLChart data={filteredData} selectedSegment={formatSelectedLabel()} />
                <AnimatedDivider />
                <PnLTable data={filteredData} selectedSegment={formatSelectedLabel()} />
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
