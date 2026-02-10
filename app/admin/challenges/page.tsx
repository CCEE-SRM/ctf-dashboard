"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Challenge {
    id: string;
    title: string;
    theme: string;
    points: number;
    visible: boolean;
    createdAt: string;
}

export default function AdminChallengesPage() {
    const { token, dbUser, loading } = useAuth();
    const router = useRouter();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!token) return;

        const fetchChallenges = async () => {
            try {
                const res = await fetch("/api/admin/challenges", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setChallenges(data);
                }
            } catch (error) {
                console.error("Failed to fetch challenges", error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchChallenges();
    }, [token]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this challenge? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/admin/challenges/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setChallenges(prev => prev.filter(c => c.id !== id));
            } else {
                alert("Failed to delete challenge");
            }
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    if (loading || loadingData) return <div className="p-8 font-mono-retro">Loading...</div>;

    if (!dbUser || dbUser.role !== 'ADMIN') {
        return <div className="p-8 text-red-600 font-pixel">Access Denied. Admins only.</div>;
    }

    return (
        <div className="min-h-screen bg-zinc-100 text-black p-8 relative selection:bg-purple-500 selection:text-white font-mono-retro">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.png')] opacity-10 pointer-events-none fixed"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-12 flex justify-between items-end border-b-4 border-black pb-6 border-dashed">
                    <div>
                        <h1 className="text-5xl font-pixel mb-2 text-shadow-retro">ADMIN CONSOLE</h1>
                        <p className="text-xl font-mono-retro bg-black text-white inline-block px-2">
                            Manage Challenges & Content
                        </p>
                    </div>
                    <Link
                        href="/admin/challenges/create"
                        className="bg-retro-green text-black font-bold py-3 px-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-2 font-pixel text-lg"
                    >
                        <span>+ NEW CHALLENGE</span>
                    </Link>
                </header>

                <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-black text-white">
                                <tr>
                                    <th className="p-4 font-pixel text-xl uppercase tracking-wider border-b-2 border-black">Title</th>
                                    <th className="p-4 font-pixel text-xl uppercase tracking-wider border-b-2 border-black">Theme</th>
                                    <th className="p-4 font-pixel text-xl uppercase tracking-wider border-b-2 border-black">Points</th>
                                    <th className="p-4 font-pixel text-xl uppercase tracking-wider border-b-2 border-black">Status</th>
                                    <th className="p-4 font-pixel text-xl uppercase tracking-wider border-b-2 border-black text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {challenges.map(challenge => (
                                    <tr key={challenge.id} className="border-b-2 border-black hover:bg-yellow-50 transition-colors group">
                                        <td className="p-4 font-bold text-lg">{challenge.title}</td>
                                        <td className="p-4">
                                            <span className="bg-zinc-200 border-2 border-black px-2 py-1 text-sm font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                                                {challenge.theme}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono-retro text-purple-700 font-bold">{challenge.points}pts</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 border-2 border-black text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-block ${challenge.visible ? 'bg-green-400 text-black' : 'bg-red-400 text-black'}`}>
                                                {challenge.visible ? 'VISIBLE' : 'HIDDEN'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-4">
                                            <Link
                                                href={`/admin/challenges/edit/${challenge.id}`}
                                                className="inline-block text-blue-600 hover:text-blue-800 font-bold hover:underline font-pixel uppercase tracking-wide"
                                            >
                                                [ Edit ]
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(challenge.id)}
                                                className="inline-block text-red-600 hover:text-red-800 font-bold hover:underline font-pixel uppercase tracking-wide"
                                            >
                                                [ Delete ]
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {challenges.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-zinc-500 font-pixel text-2xl">
                                            NO CHALLENGES FOUND. // SYSTEM EMPTY
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
