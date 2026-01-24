"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";

interface Challenge {
    id: string;
    title: string;
    description: string;
    theme: string;
    link?: string;
    points: number;
    solved: boolean;
}

export default function ChallengesPage() {
    const { token, loading: authLoading } = useAuth();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [inputs, setInputs] = useState<{ [key: string]: string }>({});
    const [responses, setResponses] = useState<{ [key: string]: { type: "success" | "error"; message: string } }>({});

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const res = await fetch("/api/challenges", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setChallenges(data);
                }
            } catch (error) {
                console.error("Failed to fetch challenges", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading && token) {
            fetchChallenges();
        } else if (!authLoading && !token) {
            setLoading(false); // No token, stop loading but show "Access Denied" or login prompt via logic below
        }
    }, [authLoading, token]);

    const handleInputChange = (id: string, value: string) => {
        setInputs((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (id: string) => {
        const flag = inputs[id];
        if (!flag) return;

        setSubmitting(id);

        // Clear previous response
        setResponses(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        try {
            const res = await fetch("/api/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ challengeId: id, flag }),
            });

            const data = await res.json();

            if (res.ok) {
                setResponses((prev) => ({
                    ...prev,
                    [id]: { type: "success", message: data.message },
                }));
                // Mark as solved locally
                setChallenges(prev => prev.map(c => c.id === id ? { ...c, solved: true } : c));
            } else {
                setResponses((prev) => ({
                    ...prev,
                    [id]: { type: "error", message: data.error },
                }));
            }
        } catch {
            setResponses((prev) => ({
                ...prev,
                [id]: { type: "error", message: "Network error occurred." },
            }));
        } finally {
            setSubmitting(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="animate-pulse">Loading Challenges...</div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Login Required</h1>
                    <p className="mb-4">Please sign in to view and submit challenges.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-4">
                        CHALLENGES
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg uppercase tracking-widest font-semibold">
                        Solve Problems. Capture Flags.
                    </p>
                </header>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
                    {challenges.map((challenge) => (
                        <div
                            key={challenge.id}
                            className={`bg-white dark:bg-zinc-900 rounded-2xl border p-6 flex flex-col justify-between shadow-sm transition-all duration-300 ${challenge.solved
                                ? "border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)] opacity-80"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-lg"
                                }`}
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider text-zinc-500">
                                        {challenge.theme}
                                    </div>
                                    <div className="font-mono font-bold text-green-600 dark:text-green-400">
                                        {challenge.points} pts
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold tracking-tight">{challenge.title}</h2>

                                <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400">
                                    <ReactMarkdown>{challenge.description}</ReactMarkdown>
                                </div>

                                {challenge.link && (
                                    <a
                                        href={challenge.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        resources/link ↗
                                    </a>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                {challenge.solved ? (
                                    <div className="flex items-center justify-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold border border-green-200 dark:border-green-800/50">
                                        ✅ Solved
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Flag{...}"
                                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                value={inputs[challenge.id] || ""}
                                                onChange={(e) => handleInputChange(challenge.id, e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit(challenge.id)}
                                            />
                                        </div>

                                        {responses[challenge.id] && (
                                            <div className={`text-xs p-2 rounded ${responses[challenge.id].type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                }`}>
                                                {responses[challenge.id].message}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => handleSubmit(challenge.id)}
                                            disabled={submitting === challenge.id || !inputs[challenge.id]}
                                            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                                        >
                                            {submitting === challenge.id ? "Verifying..." : "Submit Flag"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {challenges.length === 0 && (
                        <div className="col-span-full text-center py-20 text-zinc-500">
                            No challenges active right now. Check back later!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
