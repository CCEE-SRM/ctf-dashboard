
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useTriggerStream } from "@/hooks/useTriggerStream";

interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: {
        name: string | null;
    };
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch("/api/announcements");
            if (res.ok) {
                const data = await res.json();
                setAnnouncements(data);
            }
        } catch (error) {
            console.error("Failed to fetch announcements", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Real-time updates
    useTriggerStream((data) => {
        if (data.announcements) {
            console.log('[SSE] Refreshing announcements...');
            fetchAnnouncements();
        }
    });

    return (
        <div className="min-h-screen bg-zinc-50 text-black font-mono-retro overflow-hidden relative selection:bg-retro-green selection:text-black">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none fixed"></div>

            {/* Top Bar */}
            <div className="border-b-2 border-black bg-white sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/challenges" className="font-bold font-pixel text-xl hover:text-retro-green transition-colors">
                            🚩 CTF_DASHBOARD
                        </Link>
                        <span className="hidden md:inline text-zinc-300">|</span>
                        <span className="hidden md:inline text-zinc-500 font-pixel text-sm uppercase">System_Announcements</span>
                    </div>
                    <Link href="/challenges" className="font-pixel text-xs bg-black text-white px-3 py-1 hover:bg-retro-green hover:text-black transition-colors">
                        [ ESC ]
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-8 md:p-12 relative z-10 overflow-y-auto">
                <h1 className="text-6xl font-pixel mb-12 text-center text-shadow-retro uppercase">
                    SYSTEM UPDATES
                </h1>

                {loading ? (
                    <div className="text-center font-pixel text-xl animate-pulse text-zinc-400">LOADING TRANSMISSION...</div>
                ) : (
                    <div className="space-y-8 pb-12">
                        {announcements.length === 0 ? (
                            <div className="text-center font-mono text-xl text-zinc-400">NO UPDATES FOUND.</div>
                        ) : (
                            announcements.map((announcement) => (
                                <div key={announcement.id} className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] transition-transform">
                                    <div className="flex justify-between items-start mb-4 border-b-2 border-black border-dashed pb-4">
                                        <h2 className="text-2xl font-bold font-mono-retro text-retro-green bg-black px-2 py-1 inline-block">
                                            {announcement.title}
                                        </h2>
                                        <div className="text-right">
                                            <div className="font-mono text-xs text-zinc-500">
                                                {new Date(announcement.createdAt).toLocaleString()}
                                            </div>
                                            <div className="font-pixel text-xs text-zinc-400 uppercase">
                                                FROM: {announcement.author?.name || "ADMIN"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="prose prose-zinc max-w-none font-mono">
                                        <ReactMarkdown>{announcement.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
