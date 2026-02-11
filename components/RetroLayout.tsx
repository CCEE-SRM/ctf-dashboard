"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface RetroLayoutProps {
    children: ReactNode;
    title: string; // Text for the left vertical sidebar (e.g., "Challenges", "Scoreboard")
    activePage?: 'challenges' | 'leaderboard' | 'profile' | 'announcements';
}

export default function RetroLayout({ children, title, activePage }: RetroLayoutProps) {
    const { token, user } = useAuth();
    const [eventState, setEventState] = useState<'START' | 'PAUSE' | 'STOP'>('START');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const currentDate = new Date().toLocaleDateString('en-GB');

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/status");
                if (res.ok) {
                    const data = await res.json();
                    setEventState(data.eventState);
                }
            } catch (error) {
                console.error("Failed to fetch status", error);
            }
        };
        fetchStatus();
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-retro-bg text-black font-mono-retro">

            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                {/* 0. TOP HUD (Retro Header) */}
                <div className="h-24 border-b-2 border-retro-border bg-zinc-100 flex items-center justify-between px-6 shrink-0 relative z-20">
                    <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5 pointer-events-none"></div>

                    {/* Left: Icon & Status */}
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="text-5xl animate-bounce">
                            {title === 'Scoreboard' ? '🏁' : '🚩'}
                        </div>
                        <div className="h-12 w-[2px] bg-zinc-300"></div>
                        <div className="font-pixel text-xs md:text-sm text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <div className={`w-2 h-2 ${token ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            [{token ? `OPERATIVE: ${user?.displayName || "USER"}` : "NOT LOGGED IN"}]
                        </div>
                    </div>

                    {/* Center: D-Pad / Decorative */}
                    <div className="hidden md:flex items-center justify-center border-2 border-zinc-300 bg-white p-1 shadow-sm mx-4">
                        <div className="grid grid-cols-5 gap-[2px]">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className={`w-1 h-1 ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`}></div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="hidden md:flex items-center gap-2 border-r-2 border-zinc-300 pr-6">
                            <span className="text-5xl font-bold">⚄</span>
                            <div className="flex flex-col">
                                <span className="font-pixel text-xs text-zinc-400">UPDATES</span>
                                <Link
                                    href="/announcements"
                                    className="font-mono text-lg font-bold leading-none hover:text-retro-green hover:underline cursor-pointer transition-colors"
                                >
                                    ANNOUNCEMENTS (13)
                                </Link>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-sm text-zinc-400 mb-1">
                                {mousePos.x.toFixed(2)} | {mousePos.y.toFixed(2)}
                            </div>
                            <div className="font-pixel text-lg md:text-xl uppercase">
                                CTF {eventState === 'START' ? 'OPEN' : 'CLOSED'} <span className="text-zinc-400 text-xs">{currentDate}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* 1. LEFT SIDEBAR: Vertical Text */}
                    <div className="hidden md:flex w-40 border-r-2 border-retro-border bg-zinc-100 items-center justify-center relative shadow-inner">
                        <div className="bg-[url('/grid.png')] opacity-10 absolute inset-0"></div>
                        <div className="-rotate-90 whitespace-nowrap text-6xl font-pixel tracking-widest text-shadow-retro select-none">
                            {title}
                        </div>
                    </div>

                    {/* 2. MAIN CONTENT AREA */}
                    {children}

                </div>
            </div>

            {/* 3. RIGHT SIDEBAR */}
            <div className="hidden xl:flex w-32 border-l-2 border-retro-border bg-zinc-100 flex-col py-8 justify-between items-center text-zinc-400 hover:text-black transition-colors relative z-30">
                <div className="bg-[url('/grid.png')] opacity-10 absolute inset-0 pointer-events-none"></div>

                {activePage !== 'challenges' && (
                    <Link href="/challenges" className="writing-vertical-rl rotate-180 text-3xl font-pixel hover:text-retro-green cursor-pointer p-6 whitespace-nowrap relative z-10">
                        Challenges
                    </Link>
                )}
                {activePage === 'challenges' && (
                    <Link href="/leaderboard" className="writing-vertical-rl rotate-180 text-3xl font-pixel hover:text-retro-green cursor-pointer p-6 whitespace-nowrap relative z-10">
                        Scoreboard
                    </Link>
                )}

                <div className="h-24 w-[2px] bg-zinc-300"></div>

                <div className="h-24 w-[2px] bg-zinc-300"></div>

                <Link href="/profile" className={`writing-vertical-rl rotate-180 text-3xl font-pixel cursor-pointer p-6 whitespace-nowrap relative z-10 ${activePage === 'profile' ? 'text-black' : 'hover:text-retro-green'}`}>
                    My Team
                </Link>
            </div>

            <style jsx global>{`
                .writing-vertical-rl {
                    writing-mode: vertical-rl;
                }
                .text-shadow-retro {
                    text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
}
