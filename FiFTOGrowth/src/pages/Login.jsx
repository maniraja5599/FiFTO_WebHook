import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MeteorBackground from '../components/MeteorBackground';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();

        // Simple demonstration credentials
        if (email === 'client@fifto.com' && password === 'password123') {
            navigate('/dashboard');
        } else {
            setError('Invalid email or password. Try client@fifto.com / password123');
        }
    };

    return (
        <div className="min-h-screen bg-premium-dark flex items-center justify-center relative overflow-hidden">
            <MeteorBackground />

            <div className="absolute top-8 left-8 z-20">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Home
                </button>
            </div>

            <div className="glass-panel p-8 md:p-12 w-full max-w-md relative z-10 mx-4">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Client Login</h2>
                    <p className="text-gray-400">Access your portfolio and performance reports</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-premium-gold/50 focus:border-premium-gold text-white placeholder-gray-500 transition-all"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-premium-gold/50 focus:border-premium-gold text-white placeholder-gray-500 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-premium-gold to-yellow-600 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] text-black font-bold rounded-lg transition-all transform hover:scale-[1.02]"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <a href="#" className="text-sm text-premium-gold hover:underline">Forgot your password?</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
