"use client";

import { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface SolvedChallenge {
    id: string;
    title: string;
    points: number;
    theme: string;
    solvedAt: string;
}

interface PublicProfile {
    id: string;
    name: string | null;
    email: string;
    profileUrl: string | null;
    points: number;
    role: string;
    team?: {
        id: string;
        name: string;
        points: number;
    };
    solvedChallenges: SolvedChallenge[];
}

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const { token } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Determine if we need auth headers. Public profiles might be viewable without login?
                // Let's assume login is required for now as per app structure, or maybe not.
                // The API route doesn't enforce auth middleware explicitly in my code above, 
                // but usually good practice. However, leaderboard is public? 
                // Let's send token if available.

                const headers: HeadersInit = {};
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const res = await fetch(`/api/profile/${username}`, {
                    headers
                });

                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                } else {
                    setError("User not found");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, token]);

    if (loading) {
        return <div className="min-h-screen bg-retro-bg flex items-center justify-center font-pixel text-xl animate-pulse">LOADING DOSS_IER...</div>;
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center font-mono-retro text-black p-4 text-center">
                <h1 className="text-4xl font-pixel mb-4">404_USER_NOT_FOUND</h1>
                <p className="text-xl mb-8">{error || "The requested user does not exist in the database."}</p>
                <button
                    onClick={() => router.back()}
                    className="bg-black text-white px-6 py-3 font-bold hover:bg-retro-green hover:text-black transition-colors border-2 border-transparent hover:border-black uppercase"
                >
                    Return to safety
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-retro-bg text-black font-mono-retro overflow-hidden relative selection:bg-retro-green selection:text-black">
            <div className="flex-1 overflow-y-auto bg-zinc-100 p-4 md:p-8 relative min-h-screen">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none fixed"></div>

                <div className="max-w-5xl mx-auto relative z-10">

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
                    <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 border-2 border-black relative overflow-hidden bg-zinc-100 shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                            {profile.profileUrl ? (
                                <Image
                                    src={profile.profileUrl}
                                    alt={profile.name || "User"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl font-bold font-pixel text-zinc-400">
                                    ?
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-4xl font-pixel font-bold uppercase mb-2">{profile.name || "Anonymous"}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-xs font-bold font-mono">
                                <span className="bg-black text-white px-2 py-1 uppercase">{profile.role}</span>
                                {profile.team && (
                                    <span className="bg-retro-green text-black border border-black px-2 py-1 uppercase flex items-center gap-1">
                                        <span>TEAM:</span>
                                        {profile.team.name}
                                    </span>
                                )}
                                <span className="bg-white border border-black px-2 py-1 uppercase">
                                    <span className="text-zinc-500">POINTS:</span> {profile.points}
                                </span>
                            </div>
                        </div>

                        {/* Rank Placeholder - Could calculate if passed or fetched */}
                        <div className="text-center">
                            <div className="text-xs font-mono text-zinc-500 font-bold mb-1">TOTAL SOLVES</div>
                            <div className="font-pixel text-5xl">{profile.solvedChallenges.length}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Stats / Info Column */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <h2 className="font-pixel text-lg mb-4 border-b-2 border-black pb-2">STATS_OVERVIEW</h2>
                                <div className="space-y-4 font-mono text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Member Since</span>
                                        <span className="font-bold">2024</span> {/* Placeholder */}
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Last Active</span>
                                        <span className="font-bold">Recently</span> {/* Placeholder */}
                                    </div>
                                </div>
                            </div>

                            {profile.team && (
                                <div className="bg-zinc-900 text-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    <h2 className="font-pixel text-lg mb-4 text-retro-green border-b border-zinc-700 pb-2">TEAM_AFFILIATION</h2>
                                    <div className="text-center py-4">
                                        <div className="text-2xl font-bold font-mono mb-1">{profile.team.name}</div>
                                        <div className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Team Points: {profile.team.points}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Solved List Column */}
                        <div className="lg:col-span-2">
                            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[400px]">
                                <h2 className="font-pixel text-lg mb-6 border-b-2 border-black pb-2">SOLVED_CHALLENGES</h2>

                                {profile.solvedChallenges.length === 0 ? (
                                    <div className="h-48 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm border-2 border-dashed border-zinc-200 bg-zinc-50">
                                        <span className="text-4xl mb-2 opacity-50">🔒</span>
                                        <span>NO_SOLVES_RECORDED</span>
                                    </div>
                                ) : (
                                    <div className="space-y-0">
                                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 pb-2 px-2 border-b-2 border-black mb-2 uppercase">
                                            <div className="col-span-8">Challenge</div>
                                            <div className="col-span-2 text-center">Category</div>
                                            <div className="col-span-2 text-right">Pts</div>
                                        </div>
                                        {profile.solvedChallenges.map((challenge, i) => (
                                            <div key={challenge.id} className={`grid grid-cols-12 gap-4 py-3 px-2 items-center hover:bg-zinc-50 transition-colors ${i !== profile.solvedChallenges.length - 1 ? 'border-b border-dashed border-zinc-300' : ''}`}>
                                                <div className="col-span-8">
                                                    <div className="font-bold font-mono text-sm truncate">{challenge.title}</div>
                                                    <div className="text-[10px] text-zinc-400 font-mono">
                                                        {new Date(challenge.solvedAt).toLocaleDateString()} {new Date(challenge.solvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
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
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
