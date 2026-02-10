"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import Link from "next/link"; // For the right sidebar links

interface Challenge {
    id: string;
    title: string;
    description: string;
    theme: string;
    link?: string;
    thumbnail?: string;
    points: number;
    solved: boolean;
    attachment?: string; // Added support for attachment if API provides it, or mock it
}

export default function ChallengesPage() {
    const { token, loading: authLoading } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [flagInput, setFlagInput] = useState("");
    const [response, setResponse] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Selection State
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await fetch("/api/challenges", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setChallenges(data);
                    // Select first category and challenge by default if available
                    if (data.length > 0) {
                        const firstTheme = data[0].theme;
                        setSelectedCategory(firstTheme);
                        const firstChall = data.find((c: Challenge) => c.theme === firstTheme);
                        if (firstChall) setSelectedChallenge(firstChall);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch challenges", error);
            } finally {
                setLoading(false);
            }
        };

        if (token && !authLoading) {
            fetchChallenges();
        } else if (!authLoading && !token) {
            setLoading(false);
        }
    }, [token, authLoading]);

    // Derived Data
    const categories = useMemo(() => {
        return Array.from(new Set(challenges.map(c => c.theme)));
    }, [challenges]);

    const filteredChallenges = useMemo(() => {
        return challenges.filter(c => c.theme === selectedCategory);
    }, [challenges, selectedCategory]);

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category);
        const firstInCat = challenges.find(c => c.theme === category);
        setSelectedChallenge(firstInCat || null);
        setFlagInput("");
        setResponse(null);
    };

    const handleChallengeClick = (challenge: Challenge) => {
        setSelectedChallenge(challenge);
        setFlagInput("");
        setResponse(null);
    };

    const handleSubmit = async () => {
        if (!selectedChallenge || !flagInput) return;
        setSubmitting(selectedChallenge.id);
        setResponse(null);

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ challengeId: selectedChallenge.id, flag: flagInput }),
            });
            const data = await res.json();
            if (res.ok) {
                setResponse({ type: "success", message: data.message });
                setChallenges(prev => prev.map(c => c.id === selectedChallenge.id ? { ...c, solved: true } : c));
                setSelectedChallenge(prev => prev ? { ...prev, solved: true } : null);
            } else {
                setResponse({ type: "error", message: data.error });
            }
        } catch {
            setResponse({ type: "error", message: "Network error." });
        } finally {
            setSubmitting(null);
        }
    };

    if (authLoading || loading) {
        return <div className="min-h-screen bg-retro-bg flex items-center justify-center font-pixel text-xl">LOADING...</div>;
    }

    if (!token) {
        return (
            <div className="flex min-h-screen flex-col bg-retro-bg text-black font-mono-retro">

                <div className="flex-1 flex items-center justify-center flex-col gap-4">
                    <h1 className="text-4xl font-pixel">ACCESS DENIED</h1>
                    <p className="text-xl">Please log in to access the mainframe.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-retro-bg text-black font-mono-retro">

            {/* Main Content Area (HUD + Panels) */}
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">

                {/* 0. TOP HUD (Retro Header) */}
                <div className="h-24 border-b-2 border-retro-border bg-zinc-100 flex items-center justify-between px-6 shrink-0 relative z-20">
                    {/* Background Pattern for Header */}
                    <div className="absolute inset-0 bg-[url('/grid.png')] opacity-5 pointer-events-none"></div>

                    {/* Left: Flag & Status */}
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="text-5xl animate-bounce">
                            🚩
                        </div>
                        <div className="h-12 w-[2px] bg-zinc-300"></div>
                        <div className="font-pixel text-xs md:text-sm text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <div className={`w-2 h-2 ${token ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                            [{token ? `OPERATIVE: ${"USER"}` : "NOT LOGGED IN"}]
                        </div>
                    </div>

                    {/* Center: Decorative D-Pad / Pattern */}
                    <div className="hidden md:flex items-center justify-center border-2 border-zinc-300 bg-white p-1 shadow-sm mx-4">
                        <div className="grid grid-cols-5 gap-[2px]">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className={`w-1 h-1 ${i % 2 === 0 ? 'bg-black' : 'bg-transparent'}`}></div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Announcements & Timer */}
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="hidden md:flex items-center gap-2 border-r-2 border-zinc-300 pr-6">
                            <span className="text-5xl font-bold">⚄</span>
                            <div className="flex flex-col">
                                <span className="font-pixel text-xs text-zinc-400">UPDATES</span>
                                <span className="font-mono text-lg font-bold leading-none">ANNOUNCEMENTS (13)</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="font-mono text-sm text-zinc-400 mb-1">119.14 | 0.43</div>
                            <div className="font-pixel text-lg md:text-xl">CTF CLOSED <span className="text-zinc-400 text-xs">06/02/2026</span></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* 1. LEFT SIDEBAR: Vertical Text */}
                    <div className="hidden md:flex w-32 border-r-2 border-retro-border bg-zinc-100 items-center justify-center relative shadow-inner">
                        <div className="bg-[url('/grid.png')] opacity-10 absolute inset-0"></div>
                        <div className="-rotate-90 whitespace-nowrap text-5xl font-pixel tracking-widest text-shadow-retro select-none">
                            Challenges
                        </div>
                    </div>

                    {/* 2. CATEGORIES COLUMN */}
                    <div className="w-80 border-r-2 border-retro-border bg-white flex flex-col overflow-y-auto">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryClick(cat)}
                                className={`p-6 text-left border-b-2 border-retro-border transition-all hover:pl-8 group relative ${selectedCategory === cat
                                    ? "bg-retro-green"
                                    : "hover:bg-zinc-50"
                                    }`}
                            >
                                <span className={`text-4xl font-pixel block break-words leading-tight ${selectedCategory === cat ? 'animate-pulse' : ''}`}>
                                    {cat}
                                </span>
                                {/* Decorative Icon based on category? */}
                                <span className="absolute top-2 right-2 text-xs font-mono opacity-50 block group-hover:opacity-100">
                                    {selectedCategory === cat ? '< SELECTED' : ''}
                                </span>
                            </button>
                        ))}
                        {/* Fill empty space */}
                        <div className="flex-1 bg-zinc-50/50 relative">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,#00000005_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                        </div>
                    </div>

                    {/* 3. CHALLENGE LIST COLUMN */}
                    <div className="w-72 border-r-2 border-retro-border bg-zinc-50 flex flex-col overflow-y-auto">
                        {filteredChallenges.map(challenge => (
                            <button
                                key={challenge.id}
                                onClick={() => handleChallengeClick(challenge)}
                                className={`p-4 border-b border-retro-border/20 text-left transition-colors flex justify-between items-baseline ${selectedChallenge?.id === challenge.id
                                    ? "bg-white border-l-4 border-l-black"
                                    : "hover:bg-white text-zinc-600"
                                    }`}
                            >
                                <span className="text-xl font-bold truncate pr-2">{challenge.title.toUpperCase()}</span>
                                <span className="text-sm font-mono">{challenge.points}pt</span>
                            </button>
                        ))}
                        {filteredChallenges.length === 0 && (
                            <div className="p-8 text-zinc-400 italic">No challenges here yet.</div>
                        )}
                    </div>

                    {/* 4. DETAILS PANE (Main) */}
                    <div className="flex-1 bg-white relative flex flex-col overflow-y-auto">
                        {/* Retro Grid Background */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                        {selectedChallenge ? (
                            <div className="relative z-10 p-12 max-w-4xl">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-12 border-b-2 border-black pb-4 border-dashed">
                                    <h1 className="text-6xl font-pixel font-normal text-black leading-tight break-words max-w-2xl">
                                        {selectedChallenge.title}
                                    </h1>
                                    <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
                                        <div className="absolute -top-3 -left-3 bg-white px-1 text-xs font-bold border border-black">POINTS</div>
                                        <span className="text-4xl font-mono-retro font-bold">{selectedChallenge.points}pt</span>
                                        {/* Bracket corners */}
                                        <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-black"></div>
                                        <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-black"></div>
                                        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-black"></div>
                                        <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-black"></div>
                                    </div>
                                </div>

                                {/* Question Mark / Icon */}
                                <div className="mb-8 text-8xl opacity-10 font-pixel select-none absolute top-40 right-12 z-0">?</div>

                                {/* Description */}
                                <div className="prose prose-p:font-mono-retro prose-headings:font-pixel font-normal max-w-none text-xl mb-8 relative z-10 bg-white/80 p-4 border border-zinc-100 backdrop-blur-sm rounded">
                                    <ReactMarkdown>{selectedChallenge.description}</ReactMarkdown>
                                </div>

                                {/* Link Button */}
                                <div className="mb-8">
                                    <a
                                        href={selectedChallenge.link || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex bg-purple-600 text-white font-bold py-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all items-center gap-2 border-2 border-black no-underline"
                                    >
                                        <span>🔗 Link</span>
                                        <span className="font-mono text-sm bg-black/20 px-2 rounded truncate max-w-[200px]">
                                            {selectedChallenge.link || "No Link Provided"}
                                        </span>
                                    </a>
                                </div>

                                {/* Separator */}
                                <div className="w-full h-[2px] bg-black my-8 opacity-20"></div>

                                {/* Submission Area */}
                                <div className="bg-zinc-100 p-6 border-2 border-zinc-200">
                                    {selectedChallenge.solved ? (
                                        <div className="text-green-600 font-bold text-2xl flex items-center gap-4">
                                            <span>★ FLAG CAPTURED</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="font-mono text-sm uppercase tracking-widest text-zinc-500">Submit Flag</p>
                                            <div className="flex gap-4">
                                                <input
                                                    type="text"
                                                    placeholder="Flag{...}"
                                                    className="flex-1 bg-white border-2 border-black p-4 font-mono text-lg outline-none focus:shadow-[4px_4px_0px_0px_#ccff00]"
                                                    value={flagInput}
                                                    onChange={(e) => setFlagInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                                />
                                                <button
                                                    onClick={handleSubmit}
                                                    disabled={submitting === selectedChallenge.id}
                                                    className="bg-black text-white px-8 py-4 font-bold hover:bg-retro-green hover:text-black transition-colors border-2 border-transparent hover:border-black disabled:opacity-50"
                                                >
                                                    {submitting === selectedChallenge.id ? "..." : "SUBMIT"}
                                                </button>
                                            </div>
                                            {response && (
                                                <div className={`mt-2 font-bold ${response.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {'>'} {response.message}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Solved By mockup */}
                                <div className="mt-8 text-sm font-mono text-zinc-500">
                                    Solved by (53):
                                    <div className="mt-1 flex flex-wrap gap-2 text-black underline decoration-dashed">
                                        <span>Friendly Maltese Citizens</span> {'>'} <span>pasten</span> {'>'} <span>PwnSec</span> {'>'} <span>about:Blank</span>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-zinc-400 font-pixel text-2xl animate-pulse">
                                SELECT A CHALLENGE
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* 5. RIGHT SIDEBAR */}
            <div className="hidden xl:flex w-32 border-l-2 border-retro-border bg-zinc-100 flex-col py-8 justify-between items-center text-zinc-400 hover:text-black transition-colors relative z-30">
                <div className="bg-[url('/grid.png')] opacity-10 absolute inset-0 pointer-events-none"></div>
                <Link href="/leaderboard" className="writing-vertical-rl rotate-180 text-3xl font-pixel hover:text-retro-green cursor-pointer p-6 whitespace-nowrap relative z-10">
                    Scoreboard
                </Link>
                <div className="h-24 w-[2px] bg-zinc-300"></div>
                <Link href="/profile" className="writing-vertical-rl rotate-180 text-3xl font-pixel hover:text-retro-green cursor-pointer p-6 whitespace-nowrap relative z-10">
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
