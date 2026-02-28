"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";


interface SolvedChallenge {
    id: string;
    title: string;
    points: number;
    theme: string;
    solvedAt: string;
    solvedBy: {
        id: string;
        name: string | null;
    };
}

interface TeamMember {
    id: string;
    name: string | null;
    email: string;
    points: number;
    profileUrl: string | null;
    role: string;
}

interface HintPurchase {
    id: string;
    hintId: string;
    cost: number;
    purchasedAt: string;
    purchasedBy: {
        id: string;
        name: string | null;
    };
    hint: {
        content: string;
        challengeId: string;
        challengeTitle: string;
        theme: string;
    };
}

interface TeamProfile {
    id: string;
    name: string;
    points: number;
    leader: {
        id: string;
        name: string | null;
        email: string;
    };
    members: TeamMember[];
    solvedChallenges: SolvedChallenge[];
    hintPurchases: HintPurchase[];
    categoryStats: Record<string, number>;
}

export default function TeamProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [team, setTeam] = useState<TeamProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`/api/team/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTeam(data);
                } else {
                    setError("Team not found");
                }
            } catch (err) {
                console.error("Error fetching team:", err);
                setError("Failed to load team data");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchTeam();
        }
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-retro-bg flex items-center justify-center font-pixel text-xl animate-pulse">LOADING SYNDICATE_DATA...</div>;
    }

    if (error || !team) {
        return (
            <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center font-mono-retro text-black p-4 text-center">
                <h1 className="text-4xl font-pixel mb-4">404_TEAM_NOT_FOUND</h1>
                <p className="text-xl mb-8">{error || "The requested team does not exist in the database."}</p>
                <button
                    onClick={() => router.back()}
                    className="bg-black text-white px-6 py-3 font-bold hover:bg-retro-green hover:text-black transition-colors border-2 border-transparent hover:border-black uppercase"
                >
                    Return to safety
                </button>
            </div>
        );
    }

    // Sort solved challenges by time desc
    const sortedSolves = [...team.solvedChallenges].sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime());

    return (
        <div className="min-h-screen bg-retro-bg text-black font-mono-retro overflow-hidden relative selection:bg-retro-green selection:text-black">
            <div className="flex-1 overflow-y-auto bg-zinc-100 p-4 md:p-8 relative min-h-screen">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none fixed"></div>

                <div className="max-w-6xl mx-auto relative z-10">

                    {/* Navigation - simple back link since we removed layout */}
                    <div className="mb-8 flex gap-4 text-xs font-mono font-bold">
                        <button
                            onClick={() => router.back()}
                            className="text-zinc-500 hover:text-black hover:underline"
                        >
                            &lt; BACK
                        </button>
                        <Link href="/leaderboard" className="text-zinc-500 hover:text-retro-green hover:underline">
                            SCOREBOARD
                        </Link>
                    </div>

                    {/* Header Card */}
                    <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 flex flex-col md:flex-row items-center justify-between gap-8">

                        <div className="flex-1 text-center md:text-left">
                            <div className="text-xs font-mono text-zinc-500 font-bold mb-1 uppercase tracking-widest">SYNDICATE PROFILE</div>
                            <h1 className="text-5xl font-pixel font-bold uppercase mb-4 text-retro-green bg-black inline-block px-4 py-1">{team.name}</h1>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold font-mono items-center">
                                <span className="bg-white border-2 border-black px-3 py-1 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="text-zinc-500 mr-2">POINTS:</span>
                                    <span className="text-xl">{team.points}</span>
                                </span>
                                <span className="bg-white border-2 border-black px-3 py-1 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="text-zinc-500 mr-2">MEMBERS:</span>
                                    <span className="text-xl">{team.members.length}</span>
                                </span>
                                <span className="bg-white border-2 border-black px-3 py-1 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="text-zinc-500 mr-2">FLAGS CAPTURED:</span>
                                    <span className="text-xl">{team.solvedChallenges.length}</span>
                                </span>
                            </div>
                        </div>

                        {/* Leader Info */}
                        <div className="text-center md:text-right bg-zinc-50 p-4 border border-zinc-300">
                            <div className="text-[10px] font-mono text-zinc-400 font-bold mb-1 uppercase tracking-widest">TEAM LEADER</div>
                            <div className="flex items-center gap-3 justify-center md:justify-end">
                                <span className="font-bold font-mono text-sm">{team.leader.name || team.leader.email}</span>
                                <div className="w-10 h-10 border border-black relative overflow-hidden bg-zinc-200">
                                    {/* Use generic avatar if needed */}
                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs">IMG</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* LEFT COLUMN: Roster & Stats */}
                        <div className="lg:col-span-1 space-y-8">

                            {/* ROSTER */}
                            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <h2 className="font-pixel text-lg mb-4 border-b-2 border-black pb-2 flex justify-between items-center">
                                    <span>ROSTER</span>
                                    <span className="text-xs font-mono bg-zinc-200 px-2 rounded-full">{team.members.length}</span>
                                </h2>
                                <div className="space-y-3">
                                    {team.members.map(member => (
                                        <Link
                                            href={`/profile/${member.id}`}
                                            key={member.id}
                                            className="flex items-center gap-3 p-2 hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200 cursor-pointer group"
                                        >
                                            <div className="w-8 h-8 bg-zinc-200 border border-black relative overflow-hidden shrink-0">
                                                {member.profileUrl ? (
                                                    <Image src={member.profileUrl} alt={member.name || ""} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-zinc-400">?</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold font-mono text-sm truncate group-hover:text-retro-green transition-colors">
                                                    {member.name || "Unknown"}
                                                    {member.id === team.leader.id && <span className="text-[10px] text-zinc-400 ml-1">(L)</span>}
                                                </div>
                                                <div className="text-[10px] font-mono text-zinc-400">{member.points} pts</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* CATEGORY STATS */}
                            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <h2 className="font-pixel text-lg mb-4 border-b-2 border-black pb-2">SKILL_DISTRIBUTION</h2>
                                <div className="space-y-3">
                                    {Object.entries(team.categoryStats).sort(([, a], [, b]) => b - a).map(([cat, count]) => (
                                        <div key={cat} className="flex items-center gap-2 text-xs font-mono">
                                            <span className="w-24 font-bold text-right truncate">{cat}</span>
                                            <div className="flex-1 h-3 bg-zinc-100 border border-zinc-300 relative">
                                                <div
                                                    className="h-full bg-retro-green"
                                                    style={{ width: `${Math.min((count / Math.max(...Object.values(team.categoryStats))) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="w-6 text-right">{count}</span>
                                        </div>
                                    ))}
                                    {Object.keys(team.categoryStats).length === 0 && (
                                        <div className="text-center text-zinc-400 italic py-4">No data yet...</div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Solved Log + Hint Purchases */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[500px]">
                                <h2 className="font-pixel text-lg mb-6 border-b-2 border-black pb-2 flex justify-between items-center">
                                    <span>CAPTURE_LOG</span>
                                    <span className="text-xs font-mono">LATEST ACTIVITIES</span>
                                </h2>

                                {sortedSolves.length === 0 ? (
                                    <div className="h-64 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm border-2 border-dashed border-zinc-200 bg-zinc-50">
                                        <span className="text-4xl mb-2 opacity-50">📡</span>
                                        <span>NO_FLAGS_CAPTURED</span>
                                        <span>SYSTEM_WAITING...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 pb-2 px-2 border-b-2 border-black mb-2 uppercase">
                                            <div className="col-span-5">Challenge</div>
                                            <div className="col-span-3 text-center">Solved By</div>
                                            <div className="col-span-2 text-center">Cat.</div>
                                            <div className="col-span-2 text-right">Pts</div>
                                        </div>
                                        {sortedSolves.map((challenge, i) => (
                                            <div key={i} className={`grid grid-cols-12 gap-4 py-3 px-2 items-center hover:bg-zinc-50 transition-colors ${i !== sortedSolves.length - 1 ? 'border-b border-dashed border-zinc-300' : ''}`}>
                                                <div className="col-span-5">
                                                    <div className="font-bold font-mono text-sm truncate">{challenge.title}</div>
                                                    <div className="text-[10px] text-zinc-400 font-mono">
                                                        {new Date(challenge.solvedAt).toLocaleDateString()} {new Date(challenge.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div className="col-span-3 text-center">
                                                    <Link href={`/profile/${challenge.solvedBy.id}`} className="inline-block truncate max-w-full font-mono text-xs text-blue-600 hover:underline">
                                                        {challenge.solvedBy.name || "Unknown"}
                                                    </Link>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <span className="font-mono text-[10px] bg-black text-white px-2 py-0.5 uppercase truncate inline-block max-w-full">
                                                        {challenge.theme.substring(0, 4)}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-right font-mono font-bold text-retro-green text-sm">
                                                    +{challenge.points}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* HINT PURCHASES */}
                            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <h2 className="font-pixel text-lg mb-6 border-b-2 border-black pb-2 flex justify-between items-center">
                                    <span>HINT_PURCHASES</span>
                                    <span className="text-xs font-mono text-zinc-400">
                                        {team.hintPurchases.length > 0 ? `${team.hintPurchases.length} hint(s)` : 'NONE'}
                                    </span>
                                </h2>

                                {team.hintPurchases.length === 0 ? (
                                    <div className="h-24 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm border-2 border-dashed border-zinc-200 bg-zinc-50">
                                        <span>NO_HINTS_PURCHASED</span>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 pb-2 px-2 border-b-2 border-black mb-2 uppercase">
                                            <div className="col-span-4">Challenge</div>
                                            <div className="col-span-4">Hint Content</div>
                                            <div className="col-span-2 text-center">Bought By</div>
                                            <div className="col-span-2 text-right">Cost</div>
                                        </div>
                                        {team.hintPurchases.map((hp, i) => (
                                            <div key={hp.id} className={`grid grid-cols-12 gap-4 py-3 px-2 items-start hover:bg-zinc-50 transition-colors ${i !== team.hintPurchases.length - 1 ? 'border-b border-dashed border-zinc-300' : ''}`}>
                                                <div className="col-span-4">
                                                    <div className="font-bold font-mono text-sm truncate">{hp.hint.challengeTitle}</div>
                                                    <div className="text-[10px] text-zinc-400 font-mono">
                                                        {new Date(hp.purchasedAt).toLocaleDateString()} {new Date(hp.purchasedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <span className="font-mono text-[10px] bg-black text-white px-2 py-0.5 uppercase inline-block mt-1">{hp.hint.theme.substring(0, 4)}</span>
                                                </div>
                                                <div className="col-span-4">
                                                    <p className="font-mono text-xs text-zinc-700 break-words">{hp.hint.content}</p>
                                                </div>
                                                <div className="col-span-2 text-center">
                                                    <Link href={`/profile/${hp.purchasedBy.id}`} className="font-mono text-xs text-blue-600 hover:underline truncate inline-block max-w-full">
                                                        {hp.purchasedBy.name || 'Unknown'}
                                                    </Link>
                                                </div>
                                                <div className="col-span-2 text-right font-mono font-bold text-red-500 text-sm">
                                                    -{hp.cost}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
