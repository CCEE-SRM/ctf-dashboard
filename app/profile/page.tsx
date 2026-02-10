"use client";

import { useEffect, useState } from "react";
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

interface TeamMember {
    id: string;
    name: string | null;
    profileUrl: string | null;
    points: number;
}

interface Team {
    id: string;
    name: string;
    code: string;
    points: number;
    members: TeamMember[];
}

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    profileUrl: string | null;
    points: number;
    role: string;
    team?: Team;
}

export default function ProfilePage() {
    const { token, logout, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [solvedChallenges, setSolvedChallenges] = useState<SolvedChallenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.user);
                    setSolvedChallenges(data.solvedChallenges);
                } else {
                    console.error("Failed to fetch profile");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        }
    }, [user, authLoading, token, router]);

    if (authLoading || loading) {
        return <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-pixel text-xl animate-pulse">LOADING PROFILE...</div>;
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-zinc-100 text-black font-mono-retro overflow-hidden relative selection:bg-retro-green selection:text-black">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none fixed"></div>

            {/* Top Bar */}
            <div className="border-b-2 border-black bg-white sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/challenges" className="font-bold font-pixel text-xl hover:text-retro-green transition-colors">
                            🚩 CTF_DASHBOARD
                        </Link>
                        <span className="hidden md:inline text-zinc-300">|</span>
                        <span className="hidden md:inline text-zinc-500 font-pixel text-sm">USER_PROFILE</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: User & Team Info */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* User Card */}
                        <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="w-24 h-24 mx-auto mb-4 border-2 border-black relative overflow-hidden bg-zinc-100">
                                {profile.profileUrl ? (
                                    <Image
                                        src={profile.profileUrl}
                                        alt={profile.name || "User"}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold font-pixel text-zinc-400">
                                        ?
                                    </div>
                                )}
                            </div>
                            <h1 className="text-xl font-bold font-pixel text-center uppercase truncate">{profile.name || "Anonymous"}</h1>
                            <p className="text-zinc-500 text-xs text-center font-mono mb-4">{profile.email}</p>

                            <div className="border-t-2 border-dashed border-zinc-300 my-4"></div>

                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm">ROLE:</span>
                                <span className="font-mono bg-black text-white px-2 py-0.5 text-xs">{profile.role}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">INDIVIDUAL POINTS:</span>
                                <span className="font-mono font-bold text-lg">{profile.points}</span>
                            </div>

                            <button
                                onClick={logout}
                                className="w-full mt-6 border-2 border-red-500 text-red-600 font-bold py-2 hover:bg-red-500 hover:text-white transition-colors text-sm uppercase"
                            >
                                Sign Out
                            </button>
                        </div>

                        {/* Team Card */}
                        {profile.team && (
                            <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                <h2 className="font-pixel text-lg mb-4 border-b-2 border-black pb-2">TEAM_INFO</h2>

                                <div className="mb-4">
                                    <span className="text-xs text-zinc-500 font-bold block mb-1">TEAM NAME</span>
                                    <span className="font-mono text-xl font-bold">{profile.team.name}</span>
                                </div>

                                <div className="mb-4 bg-zinc-950 p-3 border border-black">
                                    <span className="text-xs text-zinc-500 font-bold block mb-1 uppercase tracking-wider">TEAM POINTS</span>
                                    <span className="font-mono text-3xl font-bold text-teal-400">{profile.team.points}</span>
                                </div>

                                <div className="mb-6 bg-zinc-100 border-2 border-zinc-300 p-3 text-center">
                                    <span className="text-xs text-zinc-500 font-bold block mb-1">ACCESS CODE</span>
                                    <span className="font-mono text-2xl tracking-[0.5em] font-bold select-all cursor-text text-retro-green bg-black px-2 py-1 inline-block">
                                        {profile.team.code}
                                    </span>
                                    <p className="text-[10px] text-zinc-400 mt-1">Share this code to invite members</p>
                                </div>

                                <div>
                                    <span className="text-xs text-zinc-500 font-bold block mb-3">MEMBERS ({profile.team.members.length})</span>
                                    <div className="space-y-2">
                                        {profile.team.members.map(member => (
                                            <div key={member.id} className="flex items-center justify-between text-sm border-b border-dashed border-zinc-200 pb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-zinc-200 border border-black relative overflow-hidden">
                                                        {member.profileUrl && <Image src={member.profileUrl} alt={member.name || ''} fill className="object-cover" />}
                                                    </div>
                                                    <span className={member.id === profile.id ? "font-bold" : ""}>
                                                        {member.name || "Unknown"} {member.id === profile.id && "(You)"}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-zinc-500">{member.points} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Column: Stats & History */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-zinc-500 font-bold mb-1">CHALLENGES SOLVED</div>
                                    <div className="font-pixel text-3xl">{solvedChallenges.length}</div>
                                </div>
                                <div className="text-4xl opacity-20">🎯</div>
                            </div>
                            <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-zinc-500 font-bold mb-1">TEAM RANK</div>
                                    <div className="font-pixel text-3xl">#--</div> {/* Placeholder for rank */}
                                </div>
                                <div className="text-4xl opacity-20">🏆</div>
                            </div>
                        </div>

                        {/* Solved List */}
                        <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[400px]">
                            <h2 className="font-pixel text-lg mb-6 border-b-2 border-black pb-2">SOLVED_LOG</h2>

                            {solvedChallenges.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 font-mono text-sm border-2 border-dashed border-zinc-300 bg-zinc-50">
                                    <span className="text-4xl mb-2">💾</span>
                                    <span>NO_DATA_FOUND</span>
                                    <span>START_HACKING_TO_POPULATE_LOG</span>
                                </div>
                            ) : (
                                <div className="space-y-0">
                                    <div className="grid grid-cols-12 gap-4 text-xs font-bold text-zinc-400 pb-2 px-2 border-b-2 border-black mb-2">
                                        <div className="col-span-6 md:col-span-7">CHALLENGE</div>
                                        <div className="col-span-3 md:col-span-2 text-center">CATEGORY</div>
                                        <div className="col-span-3 text-right">POINTS</div>
                                    </div>
                                    {solvedChallenges.map((challenge, i) => (
                                        <div key={challenge.id} className={`grid grid-cols-12 gap-4 py-3 px-2 items-center hover:bg-zinc-100 transition-colors ${i !== solvedChallenges.length - 1 ? 'border-b border-dashed border-zinc-300' : ''}`}>
                                            <div className="col-span-6 md:col-span-7">
                                                <div className="font-bold font-mono text-sm truncate">{challenge.title}</div>
                                                <div className="text-[10px] text-zinc-400 font-mono">
                                                    {new Date(challenge.solvedAt).toLocaleDateString()} {new Date(challenge.solvedAt).toLocaleTimeString()}
                                                </div>
                                            </div>
                                            <div className="col-span-3 md:col-span-2 text-center">
                                                <span className="font-mono text-[10px] bg-black text-white px-2 py-0.5 uppercase">
                                                    {challenge.theme}
                                                </span>
                                            </div>
                                            <div className="col-span-3 text-right font-mono font-bold text-retro-green">
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
    );
}
