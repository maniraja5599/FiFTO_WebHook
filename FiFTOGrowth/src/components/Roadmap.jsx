import React from 'react';
import { motion } from 'framer-motion';
import BarChart2 from 'lucide-react/dist/esm/icons/bar-chart-2';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Bell from 'lucide-react/dist/esm/icons/bell';
import PieChart from 'lucide-react/dist/esm/icons/pie-chart';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Lock from 'lucide-react/dist/esm/icons/lock';

const Roadmap = () => {
    const features = [
        {
            icon: BarChart2,
            title: "Positional NFO Strategies",
            description: "Optional positional NFO strategies for clients who want overnight exposure with strict risk limits. This is 100% optional and will be clearly communicated.",
            status: "COMING SOON",
            statusColor: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
        },
        {
            icon: Smartphone,
            title: "Mobile App",
            description: "Dedicated mobile application for iOS and Android to track your portfolio performance, view P&L reports, and receive real-time updates on the go.",
            status: "IN DEVELOPMENT",
            statusColor: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
        },
        {
            icon: Bell,
            title: "Real-Time Notifications",
            description: "Push notifications for daily P&L updates, trade alerts, and important portfolio milestones. Stay informed instantly.",
            status: "PLANNED",
            statusColor: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
        },
        {
            icon: PieChart,
            title: "Advanced Analytics",
            description: "Enhanced analytics dashboard with detailed performance metrics, risk analysis, and predictive insights for better decision-making.",
            status: "PLANNED",
            statusColor: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
        },
        {
            icon: Layers,
            title: "Multi-Broker Support",
            description: "Expand support for multiple broker platforms beyond Flattrade, giving clients more flexibility in their trading accounts.",
            status: "PLANNED",
            statusColor: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
        },
        {
            icon: Lock,
            title: "Enhanced Security",
            description: "Two-factor authentication, encrypted data transmission, and advanced security protocols to protect client information and portfolios.",
            status: "IN DEVELOPMENT",
            statusColor: "text-emerald-400 border-emerald-400/20 bg-emerald-400/10",
            highlight: true
        }
    ];

    return (
        <section className="py-20 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-0 w-96 h-96 bg-premium-gold/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        <span className="text-white">Future</span> <span className="text-premium-gold">Roadmap</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        We are constantly innovating to provide the best wealth management experience. Here is what we are building next.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`glass-panel p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 group ${feature.highlight ? 'border-emerald-500/50 shadow-[0_0_30px_-10px_rgba(16,185,129,0.3)]' : 'border-white/5 hover:border-premium-gold/30'}`}
                        >
                            <div className={`mb-4 inline-block p-2 rounded-xl icon-container-3d transition-colors`}>
                                <feature.icon className={`w-6 h-6 ${feature.highlight ? 'icon-3d-green' : 'icon-3d-gold'} transition-colors`} />
                            </div>

                            <h3 className="text-lg font-bold mb-2 text-white group-hover:text-premium-gold transition-colors">
                                {feature.title}
                            </h3>

                            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                                {feature.description}
                            </p>

                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${feature.statusColor}`}>
                                {feature.status}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Roadmap;
