"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Member {
    name: string | null;
    email: string;
    points: number;
    profileUrl: string | null;
}

interface Team {
    id: string;
    name: string;
    points: number;
    leader: {
        name: string | null;
        email: string;
        profileUrl: string | null;
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

        // Subscribe to real-time changes
        const channel = supabase
            .channel('leaderboard-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'Leaderboard'
                },
                (payload: any) => {
                    console.log('Real-time update received:', payload);
                    fetchLeaderboard(); // Re-fetch to ensure correct sorting and full data
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
        <div className="min-h-screen p-8 md:p-12">
            <div className="max-w-3xl mx-auto">
                <header className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                    <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                        Leaderboard
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base font-sans">
                        Top performing teams and contributors.
                    </p>
                </header>

                <div className="flex flex-col">
                    {teams.map((team, index) => (
                        <div
                            key={team.id}
                            className={`group border-b border-zinc-100 dark:border-zinc-800 last:border-0`}
                        >
                            <button
                                onClick={() => toggleTeam(team.id)}
                                className="w-full flex items-center justify-between py-6 px-4 hover:opacity-80 transition-opacity outline-none"
                            >
                                <div className="flex items-center gap-6">
                                    <span className={`font-mono text-xl font-bold w-8 text-center ${index === 0 ? "text-yellow-500" :
                                        index === 1 ? "text-zinc-400" :
                                            index === 2 ? "text-orange-400" :
                                                "text-zinc-300 dark:text-zinc-600"
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <div className="text-left">
                                            <h3 className="text-lg font-serif font-bold text-foreground flex items-center gap-3">
                                                {team.leader?.profileUrl ? (
                                                    <img
                                                        src={team.leader.profileUrl}
                                                        alt="Leader"
                                                        className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                                        {team.leader?.name ? team.leader.name[0].toUpperCase() : (team.leader?.email?.[0].toUpperCase() || "?")}
                                                    </div>
                                                )}
                                                {team.name}
                                            </h3>
                                            <span className="text-xs text-zinc-400 uppercase tracking-wider font-sans ml-11">
                                                {team.leader?.name || team.leader?.email || "Anonymous"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <div className="text-2xl font-mono font-bold text-primary">
                                            {team.points}
                                        </div>
                                    </div>
                                    <div className={`text-zinc-300 dark:text-zinc-600 transform transition-transform duration-300 ${expandedTeam === team.id ? 'rotate-180' : ''}`}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Details */}
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${expandedTeam === team.id
                                    ? "grid-rows-[1fr] opacity-100 pb-6"
                                    : "grid-rows-[0fr] opacity-0"
                                    }`}
                            >
                                <div className="overflow-hidden px-16">
                                    <div className="pt-2 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800 space-y-3">
                                        {team.members.map((member, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between text-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {member.profileUrl ? (
                                                        <img
                                                            src={member.profileUrl}
                                                            alt={member.name || `Member ${i}`}
                                                            className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                                        />
                                                    ) : (
                                                        <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                                                            {member.name ? member.name[0].toUpperCase() : (member.email?.[0].toUpperCase() || "?")}
                                                        </span>
                                                    )}
                                                    <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                                                        {member.name || member.email}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-zinc-400">
                                                    {member.points}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {teams.length === 0 && (
                        <div className="text-center py-20 text-zinc-400 font-serif">
                            No teams ranked yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
