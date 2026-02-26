import React from 'react';
import { VERIFIED_PNL_URL } from '../config';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Phone from 'lucide-react/dist/esm/icons/phone';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Instagram from 'lucide-react/dist/esm/icons/instagram';
import Youtube from 'lucide-react/dist/esm/icons/youtube';
import Linkedin from 'lucide-react/dist/esm/icons/linkedin';
import Send from 'lucide-react/dist/esm/icons/send';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

const Footer = () => {
    return (
        <footer className="bg-black border-t border-white/10 pt-24 pb-12">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-32 mb-20">
                    {/* Column 1: Brand & Connect */}
                    <div className="space-y-10">
                        <div className="flex flex-col items-start cursor-pointer group">
                            {/* Main Logo Text */}
                            <div className="relative text-6xl leading-none" style={{
                                fontFamily: '"Anton", sans-serif',
                                letterSpacing: '0.1em'
                            }}>
                                <span className="text-green-700" style={{
                                    background: 'linear-gradient(to bottom, #008000, #004d00)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>F</span>
                                <span className="relative inline-block">
                                    <span className="text-green-700" style={{
                                        background: 'linear-gradient(to bottom, #008000, #004d00)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>i</span>
                                    {/* Red Dot */}
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-red-600 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),2px_2px_4px_rgba(0,0,0,0.4)] border border-red-400"></span>
                                </span>
                                <span className="text-green-700" style={{
                                    background: 'linear-gradient(to bottom, #008000, #004d00)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>F</span>
                                <span className="text-green-700" style={{
                                    background: 'linear-gradient(to bottom, #008000, #004d00)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>T</span>
                                <span className="text-red-600" style={{
                                    background: 'linear-gradient(to bottom, #ff3333, #cc0000)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>O</span>
                            </div>

                            {/* Tagline */}
                            <div className="mt-4 text-lg font-bold tracking-wide whitespace-nowrap">
                                <span className="text-green-800">Your trusted partner in </span>
                                <span className="text-red-700">financial growth</span>
                            </div>

                            {/* Decorative Lines */}
                            <div className="flex items-center gap-2 mt-1 w-full max-w-[280px]">
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-green-700 to-transparent rounded-full"></div>
                                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-red-700 to-transparent rounded-full"></div>
                            </div>
                        </div>

                        <p className="text-gray-400 text-base leading-relaxed max-w-sm">
                            Premium portfolio management services designed exclusively for High Net-worth Individuals. We prioritize transparency, consistency, and long-term wealth generation.
                        </p>

                        <div className="flex gap-4">
                            <a href="https://www.linkedin.com/in/maniraja5599/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl icon-container-3d flex items-center justify-center hover:border-blue-500/50 transition-all duration-300 group">
                                <Linkedin className="w-6 h-6 icon-3d-blue group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="https://telegram.me/s/easytrademarket" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl icon-container-3d flex items-center justify-center hover:border-blue-400/50 transition-all duration-300 group">
                                <Send className="w-6 h-6 icon-3d-blue group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="https://www.instagram.com/fifto.official/?hl=en" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl icon-container-3d flex items-center justify-center hover:border-pink-500/50 transition-all duration-300 group">
                                <Instagram className="w-6 h-6 icon-3d-pink group-hover:scale-110 transition-transform" />
                            </a>
                            <a href="https://www.youtube.com/@OfficialFiFTO" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl icon-container-3d flex items-center justify-center hover:border-red-500/50 transition-all duration-300 group">
                                <Youtube className="w-6 h-6 icon-3d-red group-hover:scale-110 transition-transform" />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Navigation */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-6">Platform</h3>
                            <ul className="space-y-4 text-base text-gray-400">
                                <li><a href="#" className="hover:text-premium-gold transition-colors duration-200 flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-premium-gold transition-colors"></span>Home</a></li>
                                <li><a href="#" className="hover:text-premium-gold transition-colors duration-200 flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-premium-gold transition-colors"></span>Roadmap</a></li>
                                <li><a href={VERIFIED_PNL_URL} target="_blank" rel="noopener noreferrer" className="hover:text-premium-gold transition-colors duration-200 flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-premium-gold transition-colors"></span>Verified P&L</a></li>
                                <li><a href="#" className="hover:text-premium-gold transition-colors duration-200 flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-premium-gold transition-colors"></span>Strategies</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-semibold text-lg mb-6">Legal</h3>
                            <ul className="space-y-4 text-base text-gray-400">
                                <li><a href="#" className="hover:text-premium-gold transition-colors duration-200">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-premium-gold transition-colors duration-200">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-premium-gold transition-colors duration-200">Risk Disclosure</a></li>
                                <li><a href="#" className="hover:text-premium-gold transition-colors duration-200">Disclaimer</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Column 3: Contact & Support */}
                    <div id="contact">
                        <h3 className="text-white font-semibold text-lg mb-6">Contact Us</h3>
                        <ul className="space-y-6 text-base text-gray-400 mb-8">
                            <li className="flex items-start gap-4 group">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-premium-gold/10 transition-colors">
                                    <Mail className="w-5 h-5 text-premium-gold" />
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 mb-0.5">Email</span>
                                    <span className="text-white group-hover:text-premium-gold transition-colors">official.fifto@gmail.com</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 group">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-premium-gold/10 transition-colors">
                                    <Phone className="w-5 h-5 text-premium-gold" />
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 mb-0.5">Phone</span>
                                    <span className="text-white group-hover:text-premium-gold transition-colors">+91-8300030123</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4 group">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-premium-gold/10 transition-colors">
                                    <MapPin className="w-5 h-5 text-premium-gold" />
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500 mb-0.5">Location</span>
                                    <span className="text-white group-hover:text-premium-gold transition-colors">Tamilnadu, India</span>
                                </div>
                            </li>
                        </ul>


                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} FiFTO. All rights reserved.</p>
                        <div className="flex gap-6 text-sm text-gray-500">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> System Operational</span>
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-premium-gold"></div> Market Data Active</span>
                        </div>
                    </div>

                    {/* Risk Disclaimer */}
                    <div className="p-6 bg-white/5 rounded-xl border border-white/5">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Risk Disclosure</h4>
                        <p className="text-xs text-gray-500 leading-relaxed text-justify">
                            Trading in financial markets, including derivatives (F&O), equities, and commodities, involves a high degree of risk and may not be suitable for all investors. You could lose some or all of your initial investment. Past performance is not indicative of future results. The information provided on this platform is for educational and informational purposes only and should not be construed as financial advice. FiFTO is not a SEBI registered investment advisor. Please consult with a qualified financial advisor before making any investment decisions.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
