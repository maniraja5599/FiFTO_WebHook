import React from 'react';

const MeteorBackground = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Meteor Shower */}
            {[...Array(12)].map((_, idx) => {
                const isRed = idx % 2 === 0; // Alternate colors for balance
                const dotColor = isRed ? 'bg-red-500' : 'bg-green-500';
                const tailColor = isRed ? 'from-red-500' : 'from-green-500';
                const shadowColor = isRed ? 'shadow-[0_0_2px_rgba(239,68,68,0.3)]' : 'shadow-[0_0_2px_rgba(34,197,94,0.3)]';

                return (
                    <span
                        key={idx}
                        className="absolute h-0.5 w-0.5 rotate-[215deg] animate-meteor will-change-transform"
                        style={{
                            top: Math.floor(Math.random() * 100) + '%',
                            left: Math.floor(Math.random() * 100) + '%',
                            animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + 's',
                            animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + 's',
                            opacity: [0.5, 0.3, 0.1][idx % 3],
                        }}
                    >
                        {/* Meteor Tail */}
                        <div className={`pointer-events-none absolute top-1/2 -translate-y-1/2 w-[50px] h-[1px] bg-gradient-to-r ${tailColor} to-transparent`} />
                        {/* Meteor Head (Dot) */}
                        <div className={`absolute top-1/2 left-0 -translate-y-1/2 w-[2px] h-[2px] rounded-full ${dotColor} ${shadowColor}`} />
                    </span>
                );
            })}

            {/* Ambient Glow - Optimized (removed pulse) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-premium-gold/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
};

export default MeteorBackground;
