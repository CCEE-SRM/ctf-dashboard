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

interface UserProfile {
    name: string | null;
    email: string;
    profileUrl: string | null;
    points: number;
    role: string;
}

// Since Next.js 15+, params is a Promise. We need to unwrap it.
export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
    // Unwrap params using React.use() hook or async component pattern. 
    // Since this is a client component ('use client'), we can use the `use` hook or just treat it as a promise in useEffect if we prefer, 
    // but `use` is cleaner if supported. However, standard client components receive params as a promise in recent Next.js versions (app router).
    // Let's stick to standard unwrap inside the component to be safe with types.
    const resolvedParams = use(params);
    const username = resolvedParams.username;

    const { token, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [solvedChallenges, setSolvedChallenges] = useState<SolvedChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
            return;
        }

        const fetchProfile = async () => {
            try {
                // Construct email from username
                const targetEmail = `${username}@gmail.com`;
                console.log(`Fetching profile for: ${targetEmail}`);

                const res = await fetch(`/api/profile/public?email=${targetEmail}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setProfile(data.user);
                    setSolvedChallenges(data.solvedChallenges);
                } else {
                    const err = await res.json();
                    console.error("Failed to fetch profile", err);
                    setError(err.error || "User not found or error fetching profile");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
                setError("Network error");
            } finally {
                setLoading(false);
            }
        };

        if (token && username) {
            fetchProfile();
        }
    }, [user, authLoading, token, router, username]);

    if (authLoading || loading) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-2xl font-bold mb-4 text-red-500">Error</h1>
                <p className="text-zinc-400 mb-6">{error}</p>
                <Link href="/challenges" className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                    Back to Challenges
                </Link>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Link href="/challenges" className="text-zinc-400 hover:text-white transition-colors">
                        &larr; Back to Challenges
                    </Link>
                    {/* No Logout button on public profile pages of others */}
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
                        {/* Optionally hide email if privacy is a concern, but typically public profiles show identification */}
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
                                This user hasn&apos;t solved any challenges yet.
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
