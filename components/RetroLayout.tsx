"use client";

import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

import { NotificationToast } from "./NotificationToast";

interface RetroLayoutProps {
    children: ReactNode;
    title: string; // Text for the left vertical sidebar (e.g., "Challenges", "Scoreboard")
    activePage?: 'challenges' | 'leaderboard' | 'profile';
}

export default function RetroLayout({ children, title, activePage }: RetroLayoutProps) {
    const { token, user } = useAuth();
    const [eventState, setEventState] = useState<'START' | 'PAUSE' | 'STOP'>('START');
    const [stats, setStats] = useState<{
        topTeam: { name: string, points: number } | null,
        myTeam: { name: string, points: number, rank: number } | null,
        announcementCount: number
    }>({ topTeam: null, myTeam: null, announcementCount: 0 });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [notification, setNotification] = useState<string | null>(null);
    const currentDate = new Date().toLocaleDateString('en-GB');

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch("/api/status", {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (res.ok) {
                const data = await res.json();
                setEventState(data.eventState);
                setStats({
                    topTeam: data.topTeam,
                    myTeam: data.myTeam,
                    announcementCount: data.announcementCount || 0
                });
            }
        } catch (error) {
            console.error("Failed to fetch status", error);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [token]);



    return (
        <div className="flex h-screen overflow-hidden bg-retro-bg text-black font-mono-retro">
            {notification && (
                <NotificationToast
                    message={notification}
                    onClose={() => setNotification(null)}
                />
            )}

            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                {/* 0. TOP HUD (Retro Header) */}
                <div className="h-20 border-b-2 border-retro-border bg-zinc-100 flex items-center justify-between px-6 shrink-0 relative z-20">
                    <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5 pointer-events-none"></div>

                    {/* Left: Icon & HUD Status */}
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-10 h-10 relative flex items-center justify-center">
                            <Image
                                src="/logo.png"
                                alt="CTF Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="h-10 w-[2px] bg-zinc-300"></div>
                        <div className="flex flex-col gap-1">
                            {token && stats.topTeam && (
                                <div className="font-pixel text-[10px] text-zinc-500 uppercase tracking-tight flex items-center gap-1">
                                    <span className="text-retro-green">●</span> TOP: {stats.topTeam.name} - {stats.topTeam.points} PTS
                                </div>
                            )}
                            <div className="font-pixel text-xs md:text-sm text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <div className={`w-2 h-2 ${token ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                {token ? (
                                    stats.myTeam ? (
                                        <span>YOU: #{stats.myTeam.rank} - {stats.myTeam.points} PTS</span>
                                    ) : (
                                        <span>OPERATIVE: {user?.displayName || "USER"}</span>
                                    )
                                ) : (
                                    "NOT LOGGED IN"
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Right: Info */}
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="hidden md:flex items-center gap-2 border-r-2 border-zinc-300 pr-6">
                            <div className="flex flex-col">
                                <span className="font-pixel text-xs text-zinc-400">UPDATES</span>
                                <Link
                                    href="/announcements"
                                    className="font-mono text-lg font-bold leading-none hover:text-retro-green hover:underline cursor-pointer transition-colors"
                                >
                                    ANNOUNCEMENTS ({stats.announcementCount})
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
                    <div className="hidden md:flex w-24 lg:w-32 border-r-2 border-retro-border bg-zinc-100 items-center justify-center relative shadow-inner overflow-hidden">
                        <div className="bg-[url('/grid.png')] opacity-10 absolute inset-0"></div>
                        <div className="-rotate-90 whitespace-nowrap text-3xl lg:text-5xl font-pixel tracking-widest text-shadow-retro select-none uppercase">
                            {title}
                        </div>
                    </div>

                    {/* 2. MAIN CONTENT AREA */}
                    {children}

                </div>
            </div>

            {/* 3. RIGHT SIDEBAR */}
            <div className="hidden xl:flex w-28 border-l-2 border-retro-border bg-zinc-100 flex-col py-8 justify-between items-center text-zinc-400 hover:text-black transition-colors relative z-30">
                <div className="bg-[url('/grid.png')] opacity-10 absolute inset-0 pointer-events-none"></div>

                {activePage !== 'challenges' && (
                    <Link href="/challenges" className="writing-vertical-rl rotate-180 text-xl lg:text-2xl font-pixel hover:text-retro-green cursor-pointer p-6 whitespace-nowrap relative z-10 transition-all uppercase">
                        Challenges
                    </Link>
                )}
                {activePage === 'challenges' && (
                    <Link href="/leaderboard" className="writing-vertical-rl rotate-180 text-xl lg:text-2xl font-pixel hover:text-retro-green cursor-pointer p-6 whitespace-nowrap relative z-10 transition-all uppercase">
                        Scoreboard
                    </Link>
                )}

                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="h-24 w-[2px] bg-zinc-300"></div>
                    <div className="h-24 w-[2px] bg-zinc-300"></div>
                </div>

                <Link href="/profile" className={`writing-vertical-rl rotate-180 text-xl lg:text-2xl font-pixel cursor-pointer p-6 whitespace-nowrap relative z-10 transition-all uppercase ${activePage === 'profile' ? 'text-black' : 'hover:text-retro-green'}`}>
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
