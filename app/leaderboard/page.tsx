"use client";

import { useEffect, useState } from "react";

interface Member {
    name: string | null;
    email: string;
    points: number;
}

interface Team {
    id: string;
    name: string;
    points: number;
    leader: {
        name: string | null;
        email: string;
    };
    members: Member[];
}

export default function LeaderboardPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch("/api/leaderboard");
                if (res.ok) {
                    const data = await res.json();
                    setTeams(data);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const toggleTeam = (teamId: string) => {
        setExpandedTeam(expandedTeam === teamId ? null : teamId);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <div className="animate-bounce text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
                    🏆 Loading Leaderboard...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-black bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
                        LEADERBOARD
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg uppercase tracking-widest font-semibold">
                        Top Teams & Hackers
                    </p>
                </header>

                <div className="space-y-4">
                    {teams.map((team, index) => (
                        <div
                            key={team.id}
                            className={`group relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-300 ${index === 0
                                    ? "border-yellow-400/50 shadow-[0_0_30px_rgba(250,204,21,0.3)] scale-[1.02]"
                                    : index === 1
                                        ? "border-zinc-300 dark:border-zinc-600 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        : index === 2
                                            ? "border-orange-700/50 shadow-[0_0_20px_rgba(194,65,12,0.2)]"
                                            : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500/30"
                                }`}
                        >
                            {/* Rank Badge */}
                            <div className="absolute top-0 left-0 bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-br-2xl border-r border-b border-zinc-200 dark:border-zinc-700 font-bold text-lg z-10">
                                #{index + 1}
                            </div>

                            <button
                                onClick={() => toggleTeam(team.id)}
                                className="w-full text-left p-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 outline-none focus:ring-2 focus:ring-blue-500/50 rounded-2xl"
                            >
                                <div className="flex flex-col">
                                    <h3 className="text-2xl font-bold tracking-tight">
                                        {team.name}
                                    </h3>
                                    <span className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                        Leader: {team.leader?.name || team.leader?.email}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-3xl font-black tabular-nums tracking-tighter text-blue-600 dark:text-blue-400">
                                            {team.points.toLocaleString()}
                                        </div>
                                        <div className="text-xs uppercase font-bold text-zinc-400 tracking-wider">
                                            Points
                                        </div>
                                    </div>
                                    <div className={`transition-transform duration-300 ${expandedTeam === team.id ? 'rotate-180' : ''}`}>
                                        ▼
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Details */}
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${expandedTeam === team.id
                                        ? "grid-rows-[1fr] opacity-100 border-t border-zinc-100 dark:border-zinc-800"
                                        : "grid-rows-[0fr] opacity-0"
                                    }`}
                            >
                                <div className="overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
                                    <div className="p-6 sm:px-10">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">
                                            Team Members
                                        </h4>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {team.members.map((member, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                                                            {member.name ? member.name[0].toUpperCase() : "?"}
                                                        </div>
                                                        <div className="text-sm font-medium">
                                                            {member.name || member.email}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-mono font-bold text-zinc-600 dark:text-zinc-400">
                                                        {member.points} pts
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {teams.length === 0 && (
                        <div className="text-center py-20 text-zinc-500">
                            No teams found. Be the first to join!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
