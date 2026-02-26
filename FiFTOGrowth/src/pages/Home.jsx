import React, { Suspense, lazy } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MeteorBackground from '../components/MeteorBackground';

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
    return (
        <div className="bg-premium-dark min-h-screen text-white selection:bg-premium-gold selection:text-black relative">
            <MeteorBackground />
            <Navbar />
            <Hero />
            <Suspense fallback={<LoadingSpinner />}>
                <AnimatedDivider />
                <PnLChart />
                <AnimatedDivider />
                <CumulativePnLChart />
                <AnimatedDivider />
                <PnLTable />
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
