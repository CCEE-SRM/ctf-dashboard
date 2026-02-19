"use client";

import React, { useEffect, useState } from 'react';

interface NotificationToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClose, duration = 5000 }) => {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const step = 100 / (duration / 100);
        const interval = setInterval(() => {
            setProgress(prev => Math.max(0, prev - step));
        }, 100);

        const timer = setTimeout(onClose, duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [onClose, duration]);

    return (
        <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right-full fade-in duration-300">
            <div className="bg-black text-white border-2 border-retro-green p-4 shadow-[8px_8px_0px_0px_rgba(204,255,0,0.3)] min-w-[300px] relative overflow-hidden group">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-retro-green animate-pulse font-pixel">!</span>
                        <span className="font-pixel text-xs tracking-widest text-retro-green">NEW_TRANSMISSION</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white font-pixel text-xs">
                        [X]
                    </button>
                </div>

                <p className="font-mono text-sm leading-relaxed mb-1 pr-6">
                    {message}
                </p>

                <div className="absolute bottom-0 left-0 h-1 bg-retro-green transition-all duration-100 ease-linear" style={{ width: `${progress}%` }}></div>

                {/* Decorative retro accents */}
                <div className="absolute top-0 left-0 w-1 h-1 bg-retro-green"></div>
                <div className="absolute top-0 right-0 w-1 h-1 bg-retro-green"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-retro-green"></div>
            </div>
        </div>
    );
};
