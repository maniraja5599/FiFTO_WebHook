import React from 'react';

const AnimatedDivider = () => {
    return (
        <div className="w-full py-12 flex items-center justify-center gap-2 overflow-hidden">
            {/* Left Green Line */}
            <div className="relative h-[2px] w-full max-w-xs sm:max-w-sm md:max-w-md bg-gradient-to-r from-transparent via-green-700 to-green-600">
                {/* Fixed Pulse Dot at End */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-600 rounded-full shadow-[0_0_10px_2px_rgba(21,128,61,0.8)] animate-pulse"></div>

                {/* Traveling Dot */}
                <div className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.8)] animate-moveRight"></div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-600/30 to-transparent animate-[shimmer_2s_infinite_linear] -skew-x-12"></div>
            </div>

            {/* Center Gap */}

            {/* Right Red Line */}
            <div className="relative h-[2px] w-full max-w-xs sm:max-w-sm md:max-w-md bg-gradient-to-l from-transparent via-red-700 to-red-600">
                {/* Fixed Pulse Dot at Start */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_10px_2px_rgba(185,28,28,0.8)] animate-pulse"></div>

                {/* Traveling Dot */}
                <div className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_2px_rgba(255,255,255,0.8)] animate-moveLeft"></div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-red-600/30 to-transparent animate-[shimmer_2s_infinite_linear] skew-x-12"></div>
            </div>
        </div>
    );
};

export default AnimatedDivider;
