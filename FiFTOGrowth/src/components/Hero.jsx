import React from 'react';
import { motion } from 'framer-motion';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import { VERIFIED_PNL_URL } from '../config';



const Hero = () => {
    return (
        <div id="philosophy" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-premium-dark pt-20">
            {/* Background Effects Removed - Moved to Global MeteorBackground */}

            {/* Dots moved inside content for better animation context */}

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >


                    <motion.h1
                        className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight leading-tight"
                        style={{ fontFamily: '"Outfit", sans-serif' }}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1,
                                    delayChildren: 0.2
                                }
                            }
                        }}
                    >
                        {["Wealth", "Management"].map((word, i) => (
                            <motion.span
                                key={i}
                                className="inline-block mr-3 md:mr-4 text-white drop-shadow-lg"
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
                                }}
                            >
                                {word}
                            </motion.span>
                        ))}
                        <br className="hidden md:block" />
                        <span className="relative inline-block">
                            {/* Gradient Stroke Layer */}
                            <span className="absolute inset-0 z-0 select-none"
                                aria-hidden="true"
                                style={{
                                    backgroundImage: 'linear-gradient(120deg, #FFD700 0%, #FDB931 25%, #FFFF00 50%, #FDB931 75%, #FFD700 100%)',
                                    backgroundSize: '200% auto',
                                    animation: 'shine 3s linear infinite',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    WebkitTextStroke: '6px transparent',
                                    filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))',
                                }}
                            >
                                {["Redefined", "for", "HNIs"].map((word, i) => (
                                    <span key={i} className="inline-block mr-3 md:mr-4">
                                        {word}
                                    </span>
                                ))}
                            </span>

                            {/* Dark Fill Layer */}
                            <span className="relative z-10 text-premium-dark"
                                style={{
                                    WebkitTextStroke: '1px #FFD700',
                                }}
                            >
                                {["Redefined", "for", "HNIs"].map((word, i) => (
                                    <span key={i} className="inline-block mr-3 md:mr-4">
                                        {word}
                                    </span>
                                ))}
                            </span>

                            <style jsx>{`
                                @keyframes shine {
                                    0% { background-position: 0% center; }
                                    100% { background-position: 200% center; }
                                }
                            `}</style>
                        </span>
                    </motion.h1>

                    {/* User Requested Background Dots - Optimized */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(5)].map((_, i) => {
                            // Assign different animation speeds based on index
                            const animClass = i % 3 === 0 ? 'animate-float-slow' : i % 3 === 1 ? 'animate-float-medium' : 'animate-float-fast';
                            return (
                                <motion.div
                                    key={i}
                                    className={`absolute mix-blend-screen filter ${i % 2 === 0 ? 'bg-green-500/20' : 'bg-red-500/20'} ${animClass}`}
                                    style={{
                                        width: Math.random() * 150 + 20 + 'px',
                                        height: Math.random() * 150 + 20 + 'px',
                                        top: Math.random() * 100 + '%',
                                        left: Math.random() * 100 + '%',
                                        filter: `blur(${Math.random() * 10 + 10}px)`,
                                        borderRadius: '50%',
                                    }}
                                    animate={{
                                        opacity: [0.2, 0.5, 0.2],
                                    }}
                                    transition={{
                                        duration: Math.random() * 3 + 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                />
                            );
                        })}
                    </div>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed" style={{ fontFamily: '"Outfit", sans-serif' }}>
                        Exclusive portfolio management for capital above <span className="text-white font-medium">₹1 Cr</span>.
                        <br className="hidden md:block" />
                        Consistent <span className="text-white font-medium">5-8%</span> monthly profits with a proven track record and verified P&L.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <a href="#contact" className="px-8 py-4 bg-gradient-to-r from-premium-gold to-yellow-600 hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] text-black font-bold text-lg rounded-xl flex items-center gap-3 transition-all transform hover:scale-105 group">
                            Start Your Journey
                            <div className="p-1 rounded-full bg-black/10 group-hover:bg-black/20 transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </a>
                        <button
                            onClick={() => window.open(VERIFIED_PNL_URL, '_blank')}
                            className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white font-semibold text-lg rounded-xl flex items-center gap-3 transition-all hover:border-white/20 group"
                        >
                            View Verified P&L
                            <div className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                            </div>
                        </button>
                    </div>

                    {/* Owner Social Link */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="mt-8 flex justify-center"
                    >
                        <a
                            href="https://www.instagram.com/maniraja__/?hl=en"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-pink-400 transition-colors group"
                        >
                            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-pink-500/10 transition-colors">
                                <Instagram className="w-4 h-4" />
                            </div>
                            <span>Connect with the Founder</span>
                        </a>
                    </motion.div>


                </motion.div>

                {/* Stats Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto"
                >
                    {[
                        { label: "Minimum Capital", value: "₹1 Cr+" },
                        { label: "Profit Sharing", value: "Performance Based" },
                        { label: "Transparency", value: "100% Live Tracking" },
                    ].map((stat, index) => (
                        <div key={index} className="glass-panel p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                            <div className="text-2xl font-bold text-white mb-1 group-hover:text-premium-gold transition-colors" style={{ fontFamily: '"Outfit", sans-serif' }}>{stat.value}</div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default Hero;
