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

interface UserProfile {
    name: string | null;
    email: string;
    profileUrl: string | null;
    points: number;
    role: string;
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
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/challenges" className="text-zinc-400 hover:text-white transition-colors">
                        &larr; Back to Challenges
                    </Link>
                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-red-600/10 text-red-500 border border-red-600/20 rounded-lg hover:bg-red-600/20 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Profile Card */}
                    <div className="md:col-span-1 bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center">
                        <div className="w-32 h-32 mx-auto bg-zinc-800 rounded-full mb-4 overflow-hidden relative">
                            {profile.profileUrl ? (
                                <Image
                                    src={profile.profileUrl}
                                    alt={profile.name || "User"}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-zinc-600">
                                    {(profile.name || profile.email).charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold mb-1">{profile.name || "Anonymous User"}</h1>
                        <p className="text-zinc-400 text-sm mb-6">{profile.email}</p>

                        <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total Points</p>
                            <p className="text-4xl font-mono text-teal-400 font-bold">{profile.points}</p>
                        </div>
                    </div>

                    {/* Stats & Solved Challenges */}
                    <div className="md:col-span-2">
                        <h2 className="text-xl font-bold mb-4">Solved Challenges <span className="text-zinc-500 text-sm font-normal ml-2">({solvedChallenges.length})</span></h2>

                        {solvedChallenges.length === 0 ? (
                            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800 text-center text-zinc-500">
                                You haven&apos;t solved any challenges yet. Get hacking!
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {solvedChallenges.map((challenge) => (
                                    <div key={challenge.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition-colors">
                                        <div>
                                            <h3 className="font-semibold">{challenge.title}</h3>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                    {challenge.theme}
                                                </span>
                                                <span className="text-xs text-zinc-500 py-0.5">
                                                    {new Date(challenge.solvedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-teal-400 font-mono font-bold">
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
    );
}
